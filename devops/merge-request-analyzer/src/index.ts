#!/usr/bin/env tsx
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

class Context {
  readonly debugging: boolean

  constructor(debug: boolean) {
    this.debugging = debug
  }

  debug(msg: string, ...rest: any[]): void {
    if (this.debugging)
      console.error(msg, ...rest)
  }

  async listWorkspacePackages(rootDir: string): Promise<Package[]> {
    const { stdout } = await execa('pnpm', [
      'list',
      '--recursive',
      '--json',
      '--only-projects',
      '--fail-if-no-match',
      '--filter',
      './(apps|packages|vendor)/*',
    ], {
      cwd: rootDir,
    }).pipeStdout!(execa('grep', ['--invert-match', 'Failed to replace env']))

    return JSON.parse(stdout)
  }

  throwAndExit(msg: string, ...args: any[]) {
    console.error(`error: ${msg}`, ...args)
    process.exit(1)
  }

  async getChangedFiles(from: string, to = 'HEAD'): Promise<string[]> {
    const { stdout } = await execa('git', ['diff', '--name-only', from, to]).catch((err) => {
      throw this.throwAndExit(`unknown commit: '${from}' ${to !== 'HEAD' ? ` or '${to}'` : ''}`, err)
    })
    return stdout?.split('\n') || []
  }

  async getProjectRoot(): Promise<string> {
    const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'])
    return stdout
  }

  async getFileAtCommit(commit: string, path: string): Promise<string | null> {
    const { stdout } = await execa('git', ['show', `${commit}:${path}`], { reject: false })
    return stdout || null
  }

  async getModifiedApps(mergeRequestDiffBase: string): Promise<string[]> {
    const rootDir = await this.getProjectRoot()
    const appDir = join(rootDir, 'apps')
    const packages = await this.listWorkspacePackages(rootDir)
    const changedFiles = await this.getChangedFiles(mergeRequestDiffBase)

    for (const pkg of packages) {
      pkg.relativePath = relative(rootDir, pkg.path)
      pkg.changedFiles = changedFiles.filter(file => file.startsWith(pkg.relativePath))
      pkg.isApp = pkg.path.startsWith(appDir)
    }

    this.debug(`Workspace:`, packages)

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

  async tryReadFile(path: string): Promise<string | null> {
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

  async comparePackageDependenciesWithCommit(packageJsonPath: string, mergeRequestDiffBase: string): Promise<boolean> {
    const rootDir = await this.getProjectRoot()
    const current = await this.tryReadFile(join(rootDir, packageJsonPath))
    const previous = await this.getFileAtCommit(mergeRequestDiffBase, packageJsonPath)
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

  async shouldLockfileBeUpdated(mergeRequestDiffBase: string): Promise<boolean> {
    const changedFiles = await this.getChangedFiles(mergeRequestDiffBase)
    const packageFiles = changedFiles.filter(file => basename(file) === 'package.json')
    for (const file of packageFiles) {
      const equal = await this.comparePackageDependenciesWithCommit(file, mergeRequestDiffBase)
      if (!equal) {
        this.debug(`Package file at ${file} has been updated. Lockfile should be updated.`)
        return true
      }
    }
    return false
  }

  async shouldBeRebased(mergeRequestDiffBase: string, mergeRequestTargetBranch: string, remoteName = 'origin') {
    const { stdout: mergeRequestTargetLatest } = await execa('git', [
      'ls-remote',
      remoteName,
      mergeRequestTargetBranch,
    ]).pipeStdout!(execa('awk', ['{print $1}']))
    this.debug(`Latest commit in ${mergeRequestTargetBranch} is ${mergeRequestTargetLatest}`)
    return !mergeRequestTargetLatest.startsWith(mergeRequestDiffBase)
  }
}

const program = new Command()
program
  .name('merge-request-analyzer')
  .argument('<commit>', 'Merge request diff base commit')
  .option('--debug', 'Emit debug messages to stderr')
  .option('--branch <branch>', 'Merge request target branch', 'main')
  .option('--remote <remote>', 'Remote repository name', 'origin')
  .action(async (commit, { branch, remote, debug }) => {
    const ctx = new Context(debug)
    console.log(JSON.stringify({
      modified_apps: await ctx.getModifiedApps(commit),
      should_update_lockfile: await ctx.shouldLockfileBeUpdated(commit),
      rebase_required: await ctx.shouldBeRebased(commit, branch, remote),
    }))
  })
  .parse()
