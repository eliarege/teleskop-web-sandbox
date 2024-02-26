import { basename, join, relative } from 'node:path'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { execa } from 'execa'
import { Command } from 'commander'
import { isEqual } from './utils'

interface Package {
  name: string
  version: string
  path: string
  private: boolean
  dependencies?: Record<string, {
    from: string
    version: string
    path: string
  }>
  devDependencies?: Record<string, {
    from: string
    version: string
    path: string
  }>
  // These are assigned after
  relativePath: string
  changedFiles: string[]
  isApp: boolean
}

async function listWorkspacePackages(): Promise<Package[]> {
  const { stdout } = await execa('pnpm', [
    'list',
    '--recursive',
    '--json',
    '--only-projects',
    '--fail-if-no-match',
    '--filter',
    '../../(apps|packages|vendor)/*',
  ])
  return JSON.parse(stdout)
}

function throwAndExit(msg: string) {
  console.error(`error: ${msg}`)
  process.exit(1)
}

async function getChangedFiles(from: string, to = 'HEAD'): Promise<string[]> {
  const { stdout } = await execa('git', ['diff', '--name-only', from, to]).catch(() => {
    throw throwAndExit(`unknown commit: '${from}' ${to !== 'HEAD' ? ` or '${to}'` : ''}`)
  })
  return stdout?.split('\n') || []
}

async function getProjectRoot(): Promise<string> {
  const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'])
  return stdout
}

async function getFileAtCommit(commit: string, path: string): Promise<string | null> {
  const { stdout } = await execa('git', ['show', `${commit}:${path}`], { reject: false })
  return stdout || null
}

async function listAppsThatShouldBeRebuilt(commit: string): Promise<string[]> {
  const rootDir = await getProjectRoot()
  const appDir = join(rootDir, 'apps')
  const packages = await listWorkspacePackages()
  const changedFiles = await getChangedFiles(commit)

  for (const pkg of packages) {
    pkg.relativePath = relative(rootDir, pkg.path)
    pkg.changedFiles = changedFiles.filter(file => file.startsWith(pkg.relativePath))
    pkg.isApp = pkg.path.startsWith(appDir)
  }

  const packagesRecord = Object.fromEntries(packages.map(pkg => [pkg.name, pkg]))

  const hasChangedFile = (pkg: Package, cache = new Map<string, boolean>()): boolean => {
    if (cache.has(pkg.name)) {
      return cache.get(pkg.name)!
    }
    if (pkg.changedFiles.length > 0) {
      return (cache.set(pkg.name, true), true)
    }
    for (const dependencyName of Object.keys(pkg.dependencies || {})) {
      const dependency = packagesRecord[dependencyName]
      if (!dependency) {
        throw new Error(`Unknown dependency: ${dependencyName}`)
      }
      if (hasChangedFile(dependency, cache)) {
        return (cache.set(pkg.name, true), true)
      }
    }
    for (const dependencyName of Object.keys(pkg.devDependencies || {})) {
      const devDependency = packagesRecord[dependencyName]
      if (!devDependency) {
        throw new Error(`Unknown devDependency: ${dependencyName}`)
      }
      if (hasChangedFile(packagesRecord[dependencyName], cache)) {
        return (cache.set(pkg.name, true), true)
      }
    }
    return (cache.set(pkg.name, false), false)
  }

  const requiresBuild = [] as string[]

  for (const pkg of packages) {
    if (pkg.isApp && hasChangedFile(pkg)) {
      requiresBuild.push(pkg.name)
    }
  }

  return requiresBuild
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    } else {
      throw err
    }
  }
}

async function comparePackageDependenciesWithCommit(packageJsonPath: string, commit: string): Promise<boolean> {
  const rootDir = await getProjectRoot()
  const current = await tryReadFile(join(rootDir, packageJsonPath))
  const previous = await getFileAtCommit(commit, packageJsonPath)
  // If `package.json` is created or deleted
  if (!current || !previous) {
    return true
  }
  const currPackage = JSON.parse(current)
  const prevPackage = JSON.parse(previous)

  return isEqual(currPackage.dependencies, prevPackage.dependencies)
    && isEqual(currPackage.devDependencies, prevPackage.devDependencies)
    && isEqual(currPackage.peerDependencies, prevPackage.peerDependencies)
}

async function shouldLockfileBeUpdated(commit: string): Promise<{ result: boolean, file: string }> {
  const changedFiles = await getChangedFiles(commit)
  const packageFiles = changedFiles.filter(file => basename(file) === 'package.json')
  for (const file of packageFiles) {
    const equal = await comparePackageDependenciesWithCommit(file, commit)
    if (!equal) {
      return { result: true, file }
    }
  }
  return { result: false, file: '' }
}

const program = new Command()

program
  .command('list-modified-apps <commit>')
  .description('Returns newline seperated list of apps that should be rebuilt for review apps')
  .action(async (commit) => {
    const apps = await listAppsThatShouldBeRebuilt(commit)
    console.log(apps.join('\n'))
  })

program
  .command('should-update-lockfile <commit>')
  .description('Should update be lockfile before building the review app')
  .action(async (commit) => {
    const output = await shouldLockfileBeUpdated(commit)
    if (output.result) {
      console.log(`Package file at '${output.file}' has changed, lockfile should be updated.`)
    }
  })

program.name('merge-request-analyzer').parse()

/*
1) Got MR
2) Detect apps
3) Build those apps
4)

*/
