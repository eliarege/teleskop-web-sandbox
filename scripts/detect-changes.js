/**
 * Detects which applications should be rebuilt in CI.
 *
 * This script reads target apps from CI parameters, checks the latest
 * container image commit hash from GitLab Container Registry, compares it
 * with the latest release tag, and prints the apps that need rebuilding.
 *
 * Required in CI:
 * - CI_JOB_TOKEN
 * - CI_PROJECT_PATH
 * - CI_REGISTRY
 * - CI_API_V4_URL
 * - CI_REGISTRY_USER
 * - CI_REGISTRY_PASSWORD
 *
 * Optional:
 * - TARGET_APPS
 */

import { spawnSync } from "node:child_process";

// helper functions

function requireEnv(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function getRegistryBearerToken(imagePath) {
  const scope = `repository:${imagePath}:pull`;

  const res = await fetch(
    `https://gitlab.com/jwt/auth?service=container_registry&scope=${encodeURIComponent(scope)}`,
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${ciRegisteryUser}:${ciRegisteryPassword}`, // fallback for using legacy token
          ).toString("base64"),
      },
    },
  );

  if (!res.ok) {
    throw new Error(`registry token error: ${res.status} ${await res.text()}`);
  }

  return (await res.json()).token;
}

async function fetchManifest(imagePath, reference, bearer) {
  const res = await fetch(
    `https://${registry}/v2/${imagePath}/manifests/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
        Accept: [
          "application/vnd.oci.image.index.v1+json",
          "application/vnd.oci.image.manifest.v1+json",
          "application/vnd.docker.distribution.manifest.list.v2+json",
          "application/vnd.docker.distribution.manifest.v2+json",
        ].join(", "),
      },
    },
  );

  if (!res.ok) {
    throw new Error(`manifest error: ${res.status} ${await res.text()}`);
  }

  return await res.json();
}

async function fetchBlob(imagePath, digest, bearer) {
  const res = await fetch(
    `https://${registry}/v2/${imagePath}/blobs/${digest}`,
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`blob error: ${res.status} ${await res.text()}`);
  }

  return await res.json();
}

async function getLatestImageCommitHash(app) {
  const imagePath = `${projectPath}/apps/${app}`;

  const bearer = await getRegistryBearerToken(imagePath);

  let manifest = await fetchManifest(imagePath, "latest", bearer);

  if (manifest.manifests) {
    const selected =
      manifest.manifests.find(
        (m) =>
          m.platform?.os === "linux" && m.platform?.architecture === "amd64",
      ) ?? manifest.manifests[0];

    manifest = await fetchManifest(imagePath, selected.digest, bearer);
  }

  const config = await fetchBlob(imagePath, manifest.config.digest, bearer);
  const labels = config.config?.Labels ?? {};

  return labels["com.eliar.manifest.build.commit_hash"];
}

function spawnSyncWrapper(executable, args = [], options = {}) {
  const output = spawnSync(executable, args, {
    ...options,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (output.error) {
    throw new Error(
      `Command could not be started: ${executable} ${args.join(" ")}\n${output.error.message}`,
    );
  }

  if (output.status !== 0) {
    throw new Error(
      `Command failed: ${executable} ${args.join(" ")}\n${output.stderr || ""}`,
    );
  }

  return output.stdout || "";
}

function gitWrapper(args, options) {
  return spawnSyncWrapper("git", args, options);
}

function pnpmWrapper(args, options) {
  return spawnSyncWrapper("pnpm", args, options);
}

//

const projectPath = requireEnv("CI_PROJECT_PATH");
const ciJobToken = requireEnv("CI_JOB_TOKEN");
const ciRegisteryUser = requireEnv("CI_REGISTRY_USER");
const ciRegisteryPassword = requireEnv("CI_REGISTRY_PASSWORD");

const registry = process.env.CI_REGISTRY || "registry.gitlab.com";
const apiv4Url = process.env.CI_API_V4_URL || "https://gitlab.com/api/v4";

const cwd = process.cwd();

const allAppsArray = process.env.TARGET_APPS
  ? process.env.TARGET_APPS.trim().split(/\s+/).filter(Boolean)
  : pnpmWrapper([
      "list",
      "--depth",
      "-1",
      "--parseable",
      "--filter",
      "./apps/*",
    ])
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter(
        (line) =>
          line.includes(`${cwd}/apps/`) || line.includes(`${cwd}\\apps\\`),
      )
      .map((line) => line.replaceAll("\\", "/"))
      .map((line) => line.split("/apps/")[1])
      .filter(Boolean)
      .map((path) => path.split("/")[0]);

async function main() {
  // 1-) fetch the commith hash's of latest images

  const appNameLastCommitHash = {};

  const results = await Promise.allSettled(
    allAppsArray.map(async (app) => {
      const commitHash = await getLatestImageCommitHash(app);
      return { app, commitHash };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      appNameLastCommitHash[result.value.app] = result.value.commitHash;
    } else {
      console.error("skipped:", result.reason.message);
    }
  }

  // console.log(appNameLastCommitHash);

  // 2-) find diff

  const appDependencies = {}; // { appName -> string : depArray -> string[] } record that holds app-names and dependencies

  allAppsArray.forEach((app) => {
    const out = spawnSyncWrapper(
      "pnpm",
      [
        "list",
        "--depth",
        "-1",
        "--parseable",
        "--filter",
        `{./apps/${app}}...`,
      ],
      { cwd: process.cwd() },
    );
    appDependencies[app] = out
      .split("\n")
      .filter((line) => line.trim() !== "")
      .filter((line) => !line.includes("node_modules"))
      .map((line) => line.replace(cwd + "/", ""));
  });

  const commitHashOfCurrentHead = gitWrapper(["rev-parse", "HEAD"]).trim();

  const shouldRebuild = new Set();
  const shouldReTag = new Set();

  for (const appName of allAppsArray) {
    // does not exist in docker img registery -> must rebuild
    if (!appNameLastCommitHash[appName]) {
      shouldRebuild.add(appName);
      continue;
    }

    const lastCommitHashOfDockerImage = appNameLastCommitHash[appName];
    const dependencies = appDependencies[appName];

    const changedFiles = gitWrapper([
      "diff",
      lastCommitHashOfDockerImage,
      commitHashOfCurrentHead,
      "--name-only",
    ])
      .split("\n")
      .map((file) => file.trim())
      .filter((file) => file.length > 0);

    const flag = changedFiles.some((file) => {
      return dependencies.some((deq) => file.startsWith(deq));
    });

    if (flag) {
      shouldRebuild.add(appName);
    } else {
      shouldReTag.add(appName);
    }
  }

  console.log([...shouldRebuild].join(" "));
}

main();
