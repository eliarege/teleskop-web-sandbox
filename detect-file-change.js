import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stdout } from "node:process";

const allApps =
  "archive recipes dispensing-manager-ui communication-driver machine-status machines migration-service multi-monitor planning-board planning-board-engine root websockify program-editor";

const allAppsArray = allApps.split(" ");

// utils

function spawnSyncWrapper(executable, args, options) {
    const output = spawnSync(executable, args, options);
    if(output.status != 0) {
      throw new Error(`Command failed: ${executable} ${args.join(" ")}\n${output.stderr.toString()}`);
    }
    const stdout = output.stdout.toString();
    return stdout
}

function gitWrapper(args, options) {
  return spawnSyncWrapper("git", args, options);
}

function dockerWrapper(args, options) {
  return spawnSyncWrapper("docker", args, options);
}

function gitlabWrapper(args, options) {
  return spawnSync("gitlab", args, options)
}


const app_dependencies = {} // { appName -> string : depArray -> string[] } record that holds app-names and dependencies

const cwd = process.cwd();

allAppsArray.forEach(app => {
  const out = spawnSyncWrapper("pnpm", [
    "list",
    "--depth", "-1",
    "--parseable",
    "--filter", `{./apps/${app}}...`,
  ], { cwd: process.cwd() });
  app_dependencies[app] = out.split("\n")
  .filter(line => line.trim() !== "")
  .filter(line => !line.includes("node_modules"))
  .map(line => line.replace(cwd + "/", ""))
})

console.log(app_dependencies)
process.exit(0)
// get container registery images commit hashes

const appName_lastCommitHash = {} // Record<string, string> // maps appName -> last commit hash

for (const app of allAppsArray) {
  const image = `registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/${app}`;

  try {
      const raw = dockerWrapper([
    "buildx",
    "imagetools",
    "inspect",
    image,
    "--format",
    "{{json .Image.Config.Labels}}",
  ]);

  const labels = JSON.parse(raw);
  // console.log(labels)
  appName_lastCommitHash[app] = labels["com.eliar.manifest.build.commit_hash"]

  }catch(err) {
    // app not exist
  }
  
}

const tags = gitWrapper(["tag", "--sort=creatordate"]).split('\n').filter(tag => tag.trim().length > 0)
const latestTag = tags[tags.length -1]
const commitHashOfLastTag = gitWrapper(["show-ref", "-s", latestTag]).trim()


const shouldRebuild = new Set()
const shouldReTag = new Set();

for(const appName of allAppsArray) {
  // does not exist in docker img registery -> must rebuild
  if(!appName_lastCommitHash[appName]) {
      shouldRebuild.add(appName)
      continue
  }

  const lastCommitHashOfDockerImage = appName_lastCommitHash[appName]
  const dependencies = app_dependencies[appName]

  const changedFiles = gitWrapper(["diff", lastCommitHashOfDockerImage, commitHashOfLastTag, "--name-only"])
    .split("\n")
    .map(file => file.trim())
    .filter(file => file.length > 0)

  const flag = changedFiles.some(file => {
    return dependencies.some(deq => deq.startsWith(file))
  })
  
  if(flag) {
    shouldRebuild.add(appName)
  }
  else {
    shouldReTag.add(appName)
  }

}


console.log([...shouldRebuild].join(" "))
