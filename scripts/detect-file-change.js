import { spawnSync } from 'node:child_process';

function git(args, cwd = process.cwd()) {
  const result = spawnSync('git', args, {
    cwd,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }

  return result.stdout.trim();
}

async function gitlab(path) {
  const res = await fetch(`${process.env.CI_API_V4_URL}${path}`, {
    headers: {
      'JOB-TOKEN': process.env.CI_JOB_TOKEN,
    },
  });

  if (!res.ok) {
    throw new Error(`GitLab API failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function hasSuccessfulPipeline(tag) {
  if (process.env.MOCK_SUCCESS_TAGS) {
    return process.env.MOCK_SUCCESS_TAGS.split(',').includes(tag);
  }
  
  const projectId = encodeURIComponent(process.env.CI_PROJECT_ID);

  const pipelines = await gitlab(
    `/projects/${projectId}/pipelines?ref=${encodeURIComponent(tag)}&status=success&per_page=1`
  );

  return pipelines.length > 0;
}

const repoRoot = git(['rev-parse', '--show-toplevel']);

git(['fetch', '--tags', 'origin'], repoRoot);

const currentTag = process.env.CI_COMMIT_TAG || process.argv[2];

if (!currentTag) {
  throw new Error('Current tag yok. CI_COMMIT_TAG veya argüman ver.');
}

const tags = git(['tag', '--sort=-v:refname'], repoRoot)
  .split('\n')
  .map(x => x.trim())
  .filter(Boolean)
  .filter(tag => /^v\d+\.\d+\.\d+(-rc\.\d+)?$/.test(tag))
  .filter(tag => tag !== currentTag);

let previousSuccessfulTag = null;

for (const tag of tags) {
  if (await hasSuccessfulPipeline(tag)) {
    previousSuccessfulTag = tag;
    break;
  }
}

if (!previousSuccessfulTag) {
  console.error('Previous successful tag bulunamadı.');
  console.log('');
  process.exit(0);
}

const output = git(
  ['diff', '--name-only', previousSuccessfulTag, currentTag],
  repoRoot
);

const changedApps = [
  ...new Set(
    output
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .filter(path => path.startsWith('apps/'))
      .map(path => path.split('/')[1])
  ),
];


for (const file of output.split('\n').filter(Boolean)) {
  const parts = file.split('/');

  if (parts[0] === 'packages') {
    const packageDir = parts[1];
    const packageJsonPath = join(repoRoot, 'packages', packageDir, 'package.json');

    if (!existsSync(packageJsonPath)) continue;

    const changedPackage = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const changedPackageName = changedPackage.name;

    for (const app of readdirSync(join(repoRoot, 'apps'))) {
      const appPackageJsonPath = join(repoRoot, 'apps', app, 'package.json');

      if (!existsSync(appPackageJsonPath)) continue;

      const appPackage = JSON.parse(readFileSync(appPackageJsonPath, 'utf8'));

      const deps = {
        ...appPackage.dependencies,
        ...appPackage.devDependencies,
        ...appPackage.peerDependencies,
        ...appPackage.optionalDependencies,
      };

      if (deps[changedPackageName]) {
        changedApps.add(app);
      }
    }
  }
}


console.error(`Current tag: ${currentTag}`);
console.error(`Previous successful tag: ${previousSuccessfulTag}`);
console.error(`Changed apps: ${changedApps.join(' ')}`);

console.log(changedApps.join(' '));


