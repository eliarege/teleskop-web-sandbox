import { dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { findUp } from 'find-up'
import type { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import type z from 'zod/v4'
import type { NormalChange } from 'parse-diff'
import type parseDiff from 'parse-diff'

export async function findWorkspaceDir(cwd: string): Promise<string | null> {
  const path = await findUp('.git', { cwd, type: 'directory' })
  return path ? dirname(path) : null
}

export function sha1(input: string): string {
  return createHash('sha1').update(input).digest('hex')
}

export function settle<T>(promise: Promise<T>): Promise<{ status: 'fulfilled', value: T } | { status: 'rejected', reason: unknown }> {
  return promise
    .then(value => ({ status: 'fulfilled' as const, value }))
    .catch(reason => ({ status: 'rejected' as const, reason }))
}

export function createError(message: string): z.infer<typeof CallToolResultSchema> {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${message}`,
      },
    ],
    structuredContent: {
      error: message,
    },
    isError: true,
  }
}

export function appendAIReviewFooter(string: string): string {
  return `${string}

---
> **Not**: Bu inceleme yorumu AI tarafından otomatik olarak üretilmiştir.`
}

export function between(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function getNearestNormalLineBeforeAddition(parse: parseDiff.File, line: number): number {
  for (const chunk of parse.chunks) {
    if (between(line, chunk.newStart, chunk.newStart + chunk.newLines - 1)) {
      // Find closest normal line before an addition
      const index = chunk.changes.findIndex(change => change.type === 'add' && change.ln === line)
      const closestNormal = findRight(chunk.changes, index - 1, value => value.type === 'normal') as NormalChange | undefined
      if (closestNormal) {
        return closestNormal.ln1
      }
    }
  }
  return line
}

export function getNearestNormalLineBeforeDeletion(diff: parseDiff.File, line: number): number {
  for (const chunk of diff.chunks) {
    if (between(line, chunk.oldStart, chunk.oldStart + chunk.oldLines - 1)) {
      // Find closest normal line before a deletion
      const index = chunk.changes.findIndex(change => change.type === 'del' && change.ln === line)
      const closestNormal = findRight(chunk.changes, index - 1, value => value.type === 'normal') as NormalChange | undefined
      if (closestNormal) {
        return closestNormal.ln2
      }
    }
  }
  return line
}

function findRight<T>(arr: T[], startFrom: number, callback: (value: T, index: number, array: T[]) => boolean): T | undefined {
  if (startFrom >= arr.length) {
    startFrom = arr.length - 1
  }

  for (let i = Math.floor(startFrom); i >= 0; i--) {
    if (callback(arr[i], i, arr)) {
      return arr[i]
    }
  }
}
