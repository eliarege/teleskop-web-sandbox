#!/usr/bin/env node
import process from 'node:process'
import type { ExpandedMergeRequestDiffVersionsSchema } from '@gitbeaker/rest'
import { Gitlab } from '@gitbeaker/rest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod/v4'
import { createError, settle, sha1 } from './utils.ts'

const host = process.env.GITLAB_HOST || 'https://gitlab.com'
const token = process.env.GITLAB_TOKEN
const projectId = process.env.GITLAB_PROJECT_ID || 50621216

if (!token) {
  throw new Error('GITLAB_TOKEN is required')
}

const gitlab = new Gitlab({ host, token })

const server = new McpServer({
  name: 'teleskop-mcp-gitlab-merge-requests',
  version: '0.1.0',
  description: 'MCP for interacting with GitLab merge requests',
})

server.registerTool('get-merge-requests', {
  title: 'Get Open Merge Requests',
  description: 'Get open merge requests for the project.\nFormat: !IID - Title (by author) (branch: source_branch)',
}, async (extra) => {
  const mergeRequests = await settle(gitlab.MergeRequests.all({
    projectId,
    state: 'opened',
    targetBranch: 'main',
  }))

  if (mergeRequests.status === 'rejected') {
    return createError(`Failed to fetch merge requests: ${mergeRequests.reason}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Fetched ${mergeRequests.value.length} open merge requests.`,
  }, extra.sessionId)

  return {
    content: [
      {
        type: 'text',
        text: mergeRequests.value.map(mr => `!${mr.iid} - ${mr.title} (by ${mr.author.username}) (branch: ${mr.source_branch})`).join('\n')
        || 'No open merge requests found.',
      },
    ],
    structuredContent: {
      mergeRequests: mergeRequests.value,
    },
  }
})

server.registerTool('get-merge-request-commits', {
  title: 'Get Merge Request Commits',
  description: 'Get details of a specific merge request by its IID',
  inputSchema: z.object({
    iid: z.number().describe('The IID of the merge request'),
  }),
}, async (input, extra) => {
  const commits = await settle(gitlab.MergeRequests.allCommits(projectId, input.iid))
  if (commits.status === 'rejected') {
    return createError(`Failed to fetch commits for merge request !${input.iid}: ${commits.reason}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Fetched ${commits.value.length} commits for merge request !${input.iid}.`,
  }, extra.sessionId)

  return {
    content: [
      {
        type: 'text',
        text: commits.value.map(commit => `- ${commit.id}: ${commit.title} by ${commit.author_name}`).join('\n')
        || 'No commits found for this merge request.',
      },
    ],
    structuredContent: {
      commits: commits.value,
    },
  }
})

server.registerTool(`get-merge-request-diffs`, {
  title: 'Get Merge Request Diffs',
  description: 'Get diffs of a specific merge request by its IID',
  inputSchema: z.object({
    iid: z.number().describe('The IID of the merge request'),
  }),
}, async (input, extra) => {
  let diffVersion: ExpandedMergeRequestDiffVersionsSchema
  let lastVersion: { id: number }
  try {
    const versions = await gitlab.MergeRequests.allDiffVersions(projectId, input.iid)
    lastVersion = versions[0]
    diffVersion = await gitlab.MergeRequests.showDiffVersion(projectId, input.iid, lastVersion.id)
  } catch (error) {
    return createError(`Failed to fetch diffs for merge request !${input.iid}: ${error}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Fetched diff version ${lastVersion.id} for merge request !${input.iid}.`,
  }, extra.sessionId)

  let text = ''
  for (const diff of diffVersion.diffs) {
    if (diff.deleted_file) {
      text += `File: ${diff.new_path}\n---\n(File deleted)\n\n`
    } else {
      text += `File: ${diff.new_path}\n---\n${diff.diff}\n\n`
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: text || 'No diffs found for this merge request.',
      },
    ],
    structuredContent: {
      diffs: diffVersion.diffs,
    },
  }
})

server.registerTool('get-commit-details', {
  title: 'Get Commit Details',
  description: 'Get details of a specific commit by its ID',
  inputSchema: z.object({
    id: z.string().describe('The ID of the commit'),
  }),
}, async (input, extra) => {
  const commit = await settle(gitlab.Commits.show(projectId, input.id))
  if (commit.status === 'rejected') {
    return createError(`Failed to fetch details for commit ${input.id}: ${commit.reason}`)
  }
  server.sendLoggingMessage({
    level: 'debug',
    data: `Fetched details for commit ${input.id}.`,
  }, extra.sessionId)

  const response = [
    `Commit ${commit.value.id}`,
    `Title: ${commit.value.title}`,
    `Author: ${commit.value.author_name}`,
    `Date: ${commit.value.created_at}`,
    ``,
    `Message:`,
    `${commit.value.message}`,
  ].join('\n')

  return {
    content: [
      {
        type: 'text',
        text: response,
      },
    ],
    structuredContent: { commit: commit.value },
  }
})

server.registerTool('add-merge-request-note', {
  title: 'Add Merge Request Note',
  description: 'Add a note to a specific merge request by its IID',
  inputSchema: z.object({
    iid: z.number().describe('The IID of the merge request'),
    note: z.string().describe('The content of the note to add'),
  }),
}, async (input, extra) => {
  const note = await settle(gitlab.MergeRequestNotes.create(projectId, input.iid, input.note))
  if (note.status === 'rejected') {
    return createError(`Failed to add note to merge request !${input.iid}: ${note.reason}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Added note to merge request !${input.iid}.`,
  }, extra.sessionId)

  return {
    content: [
      {
        type: 'text',
        text: `Note added to merge request !${input.iid}: ${note.value.body}`,
      },
    ],
    structuredContent: { note: note.value },
  }
})

server.registerTool('add-merge-request-note-for-code-range', {
  title: 'Add Merge Request Note for Code Range',
  description: 'Add a note to a specific merge request at a given code range',
  inputSchema: z.object({
    iid: z.number().describe('The IID of the merge request'),
    note: z.string().describe('The content of the note to add'),
    filePath: z.string().describe('The path of the file in the merge request'),
    added: z.boolean().describe('Whether the code range is in the added (true) or removed (false) section'),
    position: z.object({
      start: z.number().describe('The starting line number of the code range'),
      end: z.number().describe('The ending line number of the code range'),
    }),
  }),
}, async (input, extra) => {
  const mergeRequest = await settle(gitlab.MergeRequests.show(projectId, input.iid))
  if (mergeRequest.status === 'rejected') {
    return createError(`Failed to fetch merge request !${input.iid}: ${mergeRequest.reason}`)
  }

  const { diff_refs } = mergeRequest.value
  const filePathSha = sha1(input.filePath)
  const note = await settle(gitlab.MergeRequestDiscussions.create(projectId, input.iid, input.note, {
    position: {
      positionType: 'text',
      baseSha: diff_refs.base_sha,
      headSha: diff_refs.head_sha,
      startSha: diff_refs.start_sha,
      newPath: input.filePath,
      oldPath: input.filePath,
      oldLine: input.added ? '' : String(input.position.end),
      newLine: input.added ? String(input.position.end) : '',
      lineRange: {
        start: {
          type: input.added ? 'new' : 'old',
          lineCode: input.added
            ? `${filePathSha}_0_${input.position.start}`
            : `${filePathSha}_${input.position.start}_0`,
          newLine: input.added ? input.position.start : undefined,
          oldLine: input.added ? undefined : input.position.start,
        },
        end: {
          type: input.added ? 'new' : 'old',
          lineCode: input.added
            ? `${filePathSha}_0_${input.position.end}`
            : `${filePathSha}_${input.position.end}_0`,
          newLine: input.added ? input.position.end : undefined,
          oldLine: input.added ? undefined : input.position.end,
        },
      },
    },
  }))
  if (note.status === 'rejected') {
    return createError(`Failed to add note to merge request !${input.iid} for file ${input.filePath}: ${note.reason}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Added note to merge request !${input.iid} for file ${input.filePath} with ID ${note.value.id}.`,
  }, extra.sessionId)

  return {
    content: [
      {
        type: 'text',
        text: `Note added to merge request !${input.iid} for file ${input.filePath}: ${note.value.body}`,
      },
    ],
    structuredContent: { note: note.value },
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('Teleskop GitLab MCP server running on stdio')
