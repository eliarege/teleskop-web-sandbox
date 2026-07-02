// 1. Registry API → app image isimlerini al
// 2. Her app için app:latest inspect et
// 3. latest image label içinden commit SHA al
// 4. git diff <latest_image_commit> <CI_COMMIT_SHA>
// 5. Değiştiyse buildx bake/build --push
// 6. Değişmediyse buildx imagetools create -t app:$CI_COMMIT_TAG app:latest

import { spawnSync } from "node:child_process";

const gitlab_legacy_token =
  "glpat--9PSlPUWpEQHl_a8jzA-ymM6MQpvOjEKdTpucjIwcQ8.01.171wxk651";
const api_v4_url = "https://gitlab.com/api/v4";
const projectPath = encodeURIComponent(
  "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox",
);

async function fetchAppsFromContainerRegistry() {
  const res = await fetch(
    `${api_v4_url}/projects/${projectPath}/registry/repositories`,
    {
      headers: {
        "PRIVATE-TOKEN": gitlab_legacy_token,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`GitLab API failed: ${res.status} ${await res.text()}`);
  }

  const repos = await res.json();
  return repos;
}

async function fetchImageTags(repoId) {
  const res = await fetch(
    `${api_v4_url}/projects/83943671/registry/repositories/${repoId}/tags`,
    {
      headers: {
        "PRIVATE-TOKEN": gitlab_legacy_token,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`GitLab API failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

// const repos = await fetchAppsFromContainerRegistry();
// const repoIds = repos.map((repo) => repo.id);

// const tags = [];

// for (const repoId of repoIds) {
//   const tag = await fetchImageTags(repoId);
//   tags.push(tag);
// }

const tags = [
  [
    {
      name: "0.83.0-hotfix1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:0.83.0-hotfix1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:0.83.0-hotfix1",
    },
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "cb623f88fad9eadb111cc4d69705c2a6f0d3b6d7",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:cb623f88fad9eadb111cc4d69705c2a6f0d3b6d7",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:cb623f88fad9eadb111cc4d69705c2a6f0d3b6d7",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/communication-driver:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/multi-monitor:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/dispensing-manager-ui:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/iovalues-server:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/iovalues-server:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/iovalues-server:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/iovalues-server:latest",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/iovalues-server:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/iovalues-server:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machine-status:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/machines:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/migration-service:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/root:v1.0.9",
    },
  ],
  [
    {
      name: "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    },
    {
      name: "bb9e5d99702798e2e7bd797559e60daebe4797e4",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:bb9e5d99702798e2e7bd797559e60daebe4797e4",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:bb9e5d99702798e2e7bd797559e60daebe4797e4",
    },
    {
      name: "latest",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:latest",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:latest",
    },
    {
      name: "v1.0.10",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:v1.0.10",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:v1.0.10",
    },
    {
      name: "v1.0.9",
      path: "eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:v1.0.9",
      location:
        "registry.gitlab.com/eliarelektronik/dijital_boyahane/intern/teleskop-web-sandbox/websockify:v1.0.9",
    },
  ],
];

const latestImages = tags.map((repoTags) =>
  repoTags.find((tag) => tag.name === "latest"),
);

function dockerLoginWithLegacyToken() {
  const res = spawnSync(
    "docker",
    ["login", "registry.gitlab.com", "-u", "oauth2", "--password-stdin"],
    {
      input: gitlab_legacy_token,
    },
  );

  return res;
}

function sh(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout);
  }

  return res.stdout.trim();
}

function getLatestImageCommit(imageLocation) {
  const labelsJson = sh("docker", [
    "buildx",
    "imagetools",
    "inspect",
    imageLocation,
    "--format",
    "{{ json .Image.Config.Labels }}",
  ]);

  const labels = JSON.parse(labelsJson);

  return JSON.parse(labelsJson);
}

// dockerLoginWithLegacyToken();

const commits = [
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:20:41Z",
    "com.eliar.manifest.name": "communication-driver",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": "[]",
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:25:35Z",
    "com.eliar.manifest.name": "multi-monitor",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": '[{"name":"access-vnc"},{"name":"manage-vnc"}]',
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:17:00Z",
    "com.eliar.manifest.name": "dispensing-manager-ui",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": '[{"name":"access"},{"name":"manage"}]',
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "afaa6d53e8ac01104bf0c4a32c3b9b73ca9602c1",
    "com.eliar.manifest.build.date": "2026-07-02T07:40:32Z",
    "com.eliar.manifest.name": "iovalues-server",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": "[]",
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.9",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:21:40Z",
    "com.eliar.manifest.name": "machine-status",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": "[]",
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:22:35Z",
    "com.eliar.manifest.name": "machines",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": '[{"name":"access"}]',
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:24:46Z",
    "com.eliar.manifest.name": "migration-service",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": "[]",
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:29:07Z",
    "com.eliar.manifest.name": "root",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": "[]",
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
  {
    "com.eliar.manifest.build.commit_hash":
      "bb9e5d99702798e2e7bd797559e60daebe4797e4",
    "com.eliar.manifest.build.date": "2026-07-02T08:30:39Z",
    "com.eliar.manifest.name": "websockify",
    "com.eliar.manifest.public": "true",
    "com.eliar.manifest.roles": '[{"name":"vnc-view"},{"name":"vnc-input"}]',
    "com.eliar.manifest.service": "false",
    "com.eliar.manifest.version": "v1.0.10",
  },
];

// for (const image of latestImages) {
//   const commit = getLatestImageCommit(image.location);

//   commits.push(commit);
// }

console.log(commits);
