import process from 'node:process'
import Module from 'node:module'
import fsp from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { platform } from 'node:os'
import type { PackageJson, ResolveOptions } from 'pkg-types'
import { readPackageJSON, writePackageJSON } from 'pkg-types'
import { nodeFileTrace } from '@vercel/nft'
import type { BuildContext } from 'unbuild'
import { findDynamicImports, findStaticImports, parseNodeModulePath, resolvePath } from 'mlly'
import semver from 'semver'
import consola from 'consola'
import { isFile, tryReadPackageJson } from './utils'

/**
 * Get dependencies of a package that are installed via external sources.
 *
 * Recurses through workspace dependencies.
 */
export async function getExternalDependencies(
  id: string = process.cwd(),
  options: ResolveOptions = {},
  seen = new Set<string>(),
): Promise<string[]> {
  const dependencies: string[] = []
  const pkg = await readPackageJSON(id, options)
  if (!pkg.name) {
    throw new Error(`package.json at ${id} missing name field`)
  }
  if (seen.has(pkg.name)) {
    return []
  }
  seen.add(pkg.name)
  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    if (version.startsWith('workspace:')) {
      dependencies.push(...await getExternalDependencies(name, options, seen))
    } else {
      dependencies.push(name)
    }
  }
  return [...new Set(dependencies)]
}

/**
 * Get dependencies of a package that are included via pnpm workspace semantics.
 *
 * Recurses through workspace dependencies.
 */
export async function getWorkspaceDependencies(
  id = process.cwd(),
  options: ResolveOptions = {},
  seen = new Set<string>(),
): Promise<string[]> {
  const dependencies: string[] = []
  const pkg = await readPackageJSON(id, options)
  if (!pkg.name) {
    throw new Error(`package.json at ${id} missing name field`)
  }
  if (seen.has(pkg.name)) {
    return []
  }
  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    if (version.startsWith('workspace:')) {
      dependencies.push(name)
      dependencies.push(...await getWorkspaceDependencies(name, options, seen))
    }
  }
  return dependencies
}

/* eslint-disable antfu/no-cjs-exports */
function applyProductionCondition(exports: PackageJson['exports']) {
  if (!exports || typeof exports === 'string') {
    return
  }
  if (exports.production) {
    if (typeof exports.production === 'string') {
      exports.default = exports.production
    } else {
      Object.assign(exports, exports.production)
    }
  }
  for (const key in exports) {
    applyProductionCondition(exports[key])
  }
}

function compareVersions(v1 = '0.0.0', v2 = '0.0.0') {
  try {
    return semver.lt(v1, v2, { loose: true }) ? 1 : -1
  } catch {
    return v1.localeCompare(v2)
  }
}

interface CopyNodeExternalsOptions {
  traceInclude?: string[]
}
/**
 * Copy all traced node_modules under `outDir.
 *
 * Should be executed after build is complete.
 *
 * Source: https://github.com/unjs/nitro/blob/main/src/rollup/plugins/externals.ts
 */
async function copyNodeExternals(ctx: Pick<BuildContext, 'buildEntries' | 'options'>, options: CopyNodeExternalsOptions = {}) {
  const builtinModules = [
    ...Module.builtinModules,
    ...Module.builtinModules.map(m => `node:${m}`),
  ]
  const outDir = isAbsolute(ctx.options.outDir)
    ? ctx.options.outDir
    : join(ctx.options.rootDir, ctx.options.outDir)

  // Resolve all imports detected in output
  const JAVASCRIPT_RE = /\.(?:[cm])?js$/

  const dependencies = new Set<string>()
  const resolvedDependencies = new Set<string>()

  for (const entry of ctx.buildEntries) {
    const entryPath = resolve(outDir, entry.path)
    // Is javascript file
    if (await isFile(entryPath) && JAVASCRIPT_RE.test(entryPath)) {
      const code = await fsp.readFile(entryPath, 'utf8')
      const imports = [
        ...findStaticImports(code).map(i => i.specifier),
        ...findDynamicImports(code).map(i => i.expression),
      ]
      for (const im of imports) {
        if (!im.startsWith('.') && !builtinModules.includes(im)) {
          dependencies.add(im)
        }
      }
    }
  }

  for (const dep of dependencies) {
    resolvedDependencies.add(await resolvePath(dep))
  }

  // Include explicitly defined modules
  if (options.traceInclude) {
    for (const name of options.traceInclude) {
      resolvedDependencies.add(await resolvePath(name))
    }
  }

  // Trace used files using `@vercel/nft`
  const result = await nodeFileTrace([...resolvedDependencies], {
    base: '/',
    processCwd: ctx.options.rootDir,
    exportsOnly: true,
  })

  const tsFiles = [] as string[]
  const nonModuleFiles = [] as string[]

  for (const file of result.fileList) {
    if (file.endsWith('.ts')) {
      tsFiles.push(file)
    }
    if (!file.includes('node_modules')) {
      nonModuleFiles.push(file)
    }
  }
  if (tsFiles.length) {
    consola.warn(`detected typescript file(s) among externals: \n${tsFiles.map(f => ` - ${f}`).join('\n')}`)
  }

  interface TracedFile {
    path: string
    subpath: string
    parents: string[]
    pkgPath: string
    pkgName: string
    pkgVersion: string
  }

  const tracedFiles: Record<string, TracedFile> = {}

  await Promise.all([...result.reasons.entries()].map(async ([_path, reason]) => {
    if (reason.ignored) {
      return
    }
    const path = await fsp.realpath(`/${_path}`)
    if (!path.includes('node_modules')) {
      return
    }
    if (!(await isFile(path))) {
      return
    }
    const {
      dir: baseDir,
      name: pkgName,
      subpath,
    } = parseNodeModulePath(path)
    if (!baseDir)
      return

    const pkgPath = join(baseDir, pkgName)
    const parents = await Promise.all(
      [...reason.parents].map(p => fsp.realpath(`/${p}`)),
    )
    tracedFiles[path] = {
      path,
      parents,
      subpath,
      pkgName,
      pkgPath,
      pkgVersion: '',
    }
  }))

  // Resolve traced packages
  interface TracedPackage {
    name: string
    versions: Record<string, {
      pkgJSON: PackageJson
      path: string
      files: string[]
    }>
  }

  const tracedPackages: Record<string, TracedPackage> = {}

  for (const tracedFile of Object.values(tracedFiles)) {
    // Use `node_modules/{name}` in path as name to support aliases
    const pkgName = tracedFile.pkgName
    let tracedPackage = tracedPackages[pkgName]
    if (!tracedPackage) {
      tracedPackage = tracedPackages[pkgName] = {
        name: pkgName,
        versions: {},
      }
    }

    // Read package.json for file
    let pkgJSON = await tryReadPackageJson(tracedFile.pkgPath, { cache: true })
    if (!pkgJSON) {
      pkgJSON = <PackageJson>{ name: pkgName, version: '0.0.0' }
    }
    if (!pkgJSON.version) {
      throw new Error(`missing version property at ${tracedFile.pkgPath}`)
    }

    let tracedPackageVersion = tracedPackage.versions[pkgJSON.version]
    if (!tracedPackageVersion) {
      tracedPackageVersion = tracedPackage.versions[pkgJSON.version] = {
        path: tracedFile.pkgPath,
        files: [],
        pkgJSON,
      }
    }
    tracedPackageVersion.files.push(tracedFile.path)
    tracedFile.pkgName = pkgName
    tracedFile.pkgVersion = pkgJSON.version
  }

  const isWindows = platform() === 'win32'

  // Utility to find package parents
  function findPackageParents(pkg: TracedPackage, version: string) {
    // Try to find parent packages
    const versionFiles: TracedFile[] = pkg.versions[version].files.map(
      path => tracedFiles[path],
    )
    const parentPkgs = [
      ...new Set(
        versionFiles.flatMap(file =>
          file.parents
            .map((parentPath) => {
              const parentFile = tracedFiles[parentPath]
              if (parentFile.pkgName === pkg.name) {
                return null
              }
              return `${parentFile.pkgName}@${parentFile.pkgVersion}`
            })
            .filter(Boolean),
        ),
      ),
    ]
    return parentPkgs as string[]
  }

  async function writePackage(
    name: string,
    version: string,
    _pkgPath?: string,
  ) {
    // Find pkg
    const pkg = tracedPackages[name]
    const pkgPath = _pkgPath || pkg.name

    // Copy files
    for (const src of pkg.versions[version].files) {
      const { subpath } = parseNodeModulePath(src)
      const dst = join(outDir, 'node_modules', pkgPath, subpath!)
      await fsp.mkdir(dirname(dst), { recursive: true })
      await fsp.copyFile(src, dst)
    }

    // Copy package.json
    const pkgJSON = pkg.versions[version].pkgJSON
    applyProductionCondition(pkgJSON.exports)
    const pkgJSONPath = join(
      outDir,
      'node_modules',
      pkgPath,
      'package.json',
    )
    await fsp.mkdir(dirname(pkgJSONPath), { recursive: true })
    await fsp.writeFile(
      pkgJSONPath,
      JSON.stringify(pkgJSON, null, 2),
      'utf8',
    )
  }

  async function linkPackage(from: string, to: string) {
    const src = join(outDir, 'node_modules', from)
    const dst = join(outDir, 'node_modules', to)
    const dstStat = await fsp.lstat(dst).catch(() => null)
    const exists = dstStat && dstStat.isSymbolicLink()
    // console.log("Linking", from, "to", to, exists ? "!!!!" : "");
    if (exists) {
      return
    }
    await fsp.mkdir(dirname(dst), { recursive: true })
    await fsp
      .symlink(
        relative(dirname(dst), src),
        dst,
        isWindows ? 'junction' : 'dir',
      )
      .catch((err) => {
        console.error('Cannot link', from, 'to', to, err)
      })
  }

  // Analyze dependency tree
  const singleVersionPackages: string[] = []
  const multiVersionPkgs: Record<string, { [version: string]: string[] }> = {}

  for (const tracedPackage of Object.values(tracedPackages)) {
    const versions = Object.keys(tracedPackage.versions)
    if (versions.length === 1) {
      singleVersionPackages.push(tracedPackage.name)
      continue
    }
    multiVersionPkgs[tracedPackage.name] = {}
    for (const version of versions) {
      multiVersionPkgs[tracedPackage.name][version] = findPackageParents(
        tracedPackage,
        version,
      )
    }
  }

  // Directly write single version packages
  await Promise.all(
    singleVersionPackages.map((pkgName) => {
      const pkg = tracedPackages[pkgName]
      const version = Object.keys(pkg.versions)[0]
      return writePackage(pkgName, version)
    }),
  )

  // Write packages with multiple versions
  for (const [pkgName, pkgVersions] of Object.entries(multiVersionPkgs)) {
    const versionEntires = Object.entries(pkgVersions).sort(
      ([v1, p1], [v2, p2]) => {
        // 1. Package with no parent packages to be hoisted
        if (p1.length === 0) {
          return -1
        }
        if (p2.length === 0) {
          return 1
        }
        // 2. Newest version to be hoisted
        return compareVersions(v1, v2)
      },
    )
    for (const [version, parentPkgs] of versionEntires) {
      // Write each version into node_modules/.nitro/{name}@{version}
      await writePackage(pkgName, version, `.nitro/${pkgName}@${version}`)
      // Link one version to the top level (for indirect bundle deps)
      await linkPackage(`.nitro/${pkgName}@${version}`, `${pkgName}`)
      // Link to parent packages
      for (const parentPkg of parentPkgs) {
        const parentPkgName = parentPkg.replace(/@[^@]+$/, '')
        await (multiVersionPkgs[parentPkgName]
          ? linkPackage(
              `.nitro/${pkgName}@${version}`,
              `.nitro/${parentPkg}/node_modules/${pkgName}`,
          )
          : linkPackage(
              `.nitro/${pkgName}@${version}`,
              `${parentPkgName}/node_modules/${pkgName}`,
          ))
      }
    }

    // Write an informative package.json
    const userPkg = await readPackageJSON(ctx.options.rootDir).catch(() => ({}) as PackageJson)

    await writePackageJSON(resolve(outDir, 'package.json'), {
      name: `${userPkg.name || 'server'}-prod`,
      version: userPkg.version || '0.0.0',
      type: 'module',
      private: true,
      dependencies: Object.fromEntries(
        [
          ...Object.values(tracedPackages).map(pkg => [
            pkg.name,
            Object.keys(pkg.versions)[0],
          ]),
        ].sort(([a], [b]) => a.localeCompare(b)),
      ),
    })
  }
}

/**
 * `unbuild` plugin. Injects itself to `unbuild` build process. Should be called in `build:prepare`.
 *
 * Copies all used external modules to `outDir`. Inlines workspace dependencies.
 */
export function workspaceExternals(ctx: BuildContext, options?: CopyNodeExternalsOptions) {
  ctx.hooks.hook('build:before', async (ctx) => {
    // Inline workspace dependencies
    const workspaceDependencies = await getWorkspaceDependencies()
    ctx.options.rollup.inlineDependencies = true
    ctx.options.externals = ctx.options.externals.filter(e =>
      typeof e === 'string' && !workspaceDependencies.includes(e),
    )
  })
  ctx.hooks.hook('build:done', async (ctx) => {
    consola.info(`Copying externals`)
    await copyNodeExternals(ctx, options)
  })
}
