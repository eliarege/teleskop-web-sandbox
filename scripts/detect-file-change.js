import { spawnSync } from 'node:child_process';

function git(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr);
  }

  return result.stdout.trim();
}

const repoRoot = git(['rev-parse', '--show-toplevel']);

const output = spawnSync('git', ['diff', '--name-only'], {
  cwd: repoRoot,
  env: process.env,
  encoding: 'utf8',
}).stdout;


// git(['fetch', 'origin', 'main'], repoRoot);

// const output = git(
//   ['diff', '--name-only', 'origin/main...HEAD'],
//   repoRoot
// );

const changedApps = [
  ...new Set(
    output
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .filter(path => path.startsWith('apps/'))
      .map(path => path.split('/').slice(1, 2).join(' '))
  )
].join(' ')


console.log(changedApps);


