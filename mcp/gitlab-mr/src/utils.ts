import { dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { findUp } from 'find-up'
import type { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import type z from 'zod/v4'

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
