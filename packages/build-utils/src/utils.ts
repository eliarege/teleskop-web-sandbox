import fsp from 'node:fs/promises'
import type { FindFileOptions, PackageJson, ReadOptions, ResolveOptions } from 'pkg-types'
import { readPackageJSON } from 'pkg-types'

export async function isFile(file: string) {
  return handleNoEntry(async () => {
    const stat = await fsp.stat(file)
    return stat.isFile()
  }, false)
}

export async function isDirectory(file: string) {
  return handleNoEntry(async () => {
    const stat = await fsp.stat(file)
    return stat.isDirectory()
  }, false)
}

export async function tryReadPackageJson(id?: string, options?: ResolveOptions & ReadOptions & FindFileOptions): Promise<PackageJson | null> {
  return handleNoEntry(() => {
    return readPackageJSON(id, options)
  }, null)
}

async function handleNoEntry<T, K>(fn: () => Promise<T>, noEntryValue: K): Promise<T | K> {
  try {
    return await fn()
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return noEntryValue
    } else {
      throw err
    }
  }
}
