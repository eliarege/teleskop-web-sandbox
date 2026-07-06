import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const gitlab_legacy_token =
  "glpat--9PSlPUWpEQHl_a8jzA-ymM6MQpvOjEKdTpucjIwcQ8.01.171wxk651";
const api_v4_url = "https://gitlab.com/api/v4";
const projectPath = encodeURIComponent(
  "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox",
);
const gitlabUsername = "yagiz erdem";

const allApps =
  "archive recipes dispensing-manager-ui communication-driver machine-status machines migration-service multi-monitor planning-board planning-board-engine root websockify program-editor";

const allAppsArray = allApps.split(" ");

// 1-) fetch the commith hash's of latest images

async function getRegistryBearerToken(imagePath) {
  const scope = `repository:${imagePath}:pull`;

  const res = await fetch(
    `https://gitlab.com/jwt/auth?service=container_registry&scope=${encodeURIComponent(scope)}`,
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${gitlabUsername}:${gitlab_legacy_token}`).toString(
            "base64",
          ),
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
    `https://registry.gitlab.com/v2/${imagePath}/manifests/${reference}`,
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
    `https://registry.gitlab.com/v2/${imagePath}/blobs/${digest}`,
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
  const imagePath = `eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/${app}`;

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

const appName_lastCommitHash = {};

const results = await Promise.allSettled(
  allAppsArray.map(async (app) => {
    const commitHash = await getLatestImageCommitHash(app);
    return { app, commitHash };
  }),
);

for (const result of results) {
  if (result.status === "fulfilled") {
    appName_lastCommitHash[result.value.app] = result.value.commitHash;
  } else {
    console.error("skipped:", result.reason.message);
  }
}

// console.log(appName_lastCommitHash);

// 2-) find diff

// utils

function spawnSyncWrapper(executable, args, options) {
  const output = spawnSync(executable, args, options);
  if (output.status != 0) {
    throw new Error(
      `Command failed: ${executable} ${args.join(" ")}\n${output.stderr.toString()}`,
    );
  }
  const stdout = output.stdout.toString();
  return stdout;
}

function gitWrapper(args, options) {
  return spawnSyncWrapper("git", args, options);
}

const app_dependencies = {}; // { appName -> string : depArray -> string[] } record that holds app-names and dependencies

const cwd = process.cwd();

allAppsArray.forEach((app) => {
  const out = spawnSyncWrapper(
    "pnpm",
    ["list", "--depth", "-1", "--parseable", "--filter", `{./apps/${app}}...`],
    { cwd: process.cwd() },
  );
  app_dependencies[app] = out
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => !line.includes("node_modules"))
    .map((line) => line.replace(cwd + "/", ""));
});

const tags = gitWrapper(["tag", "--sort=creatordate"])
  .split("\n")
  .filter((tag) => tag.trim().length > 0);
const latestTag = tags[tags.length - 1];
const commitHashOfLastTag = gitWrapper(["show-ref", "-s", latestTag]).trim();

const shouldRebuild = new Set();
const shouldReTag = new Set();

for (const appName of allAppsArray) {
  // does not exist in docker img registery -> must rebuild
  if (!appName_lastCommitHash[appName]) {
    shouldRebuild.add(appName);
    continue;
  }

  const lastCommitHashOfDockerImage = appName_lastCommitHash[appName];
  const dependencies = app_dependencies[appName];

  const changedFiles = gitWrapper([
    "diff",
    lastCommitHashOfDockerImage,
    commitHashOfLastTag,
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
