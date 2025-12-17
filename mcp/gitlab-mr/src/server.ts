#!/usr/bin/env node
import process from 'node:process'
import type { DiscussionNotePositionOptions, ExpandedMergeRequestDiffVersionsSchema, GitbeakerRequestError } from '@gitbeaker/rest'
import { Gitlab } from '@gitbeaker/rest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod/v4'
import parseDiff from 'parse-diff'
import { appendAIReviewFooter, createError, getNearestNormalLineBeforeAddition, getNearestNormalLineBeforeDeletion, settle, sha1 } from './utils.ts'

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

export async function getMergeRequestDiffs(id: number) {
  const versions = await gitlab.MergeRequests.allDiffVersions(projectId, id)
  const lastVersion = versions[0]
  const diffVersion = await gitlab.MergeRequests.showDiffVersion(projectId, id, lastVersion.id)
  return diffVersion.diffs
}

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
    return createError(`Failed to fetch merge requests: ${(mergeRequests.reason as GitbeakerRequestError).message}`)
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
    return createError(`Failed to fetch commits for merge request !${input.iid}: ${(commits.reason as GitbeakerRequestError).message}`)
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
  const diffs = await settle(getMergeRequestDiffs(input.iid))
  if (diffs.status === 'rejected') {
    return createError(`Failed to fetch diffs for merge request !${input.iid}: ${(diffs.reason as GitbeakerRequestError).message}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Fetched diffs for merge request !${input.iid}.`,
  }, extra.sessionId)

  let text = ''
  for (const diff of diffs.value) {
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
      diffs: diffs.value,
    },
  }
})

server.registerTool('get-merge-request-notes', {
  title: 'Get Merge Request Notes',
  description: 'Get notes of a specific merge request by its IID',
  inputSchema: z.object({
    iid: z.number().describe('The IID of the merge request'),
  }),
}, async (input, extra) => {
  const notes = await settle(gitlab.MergeRequestNotes.all(projectId, input.iid))
  if (notes.status === 'rejected') {
    return createError(`Failed to fetch notes for merge request !${input.iid}: ${(notes.reason as GitbeakerRequestError).message}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Fetched ${notes.value.length} notes for merge request !${input.iid}.`,
  }, extra.sessionId)

  return {
    content: [
      {
        type: 'text',
        text: notes.value.map(note => `- [${note.author.username}]: ${note.body}`).join('\n'),
      },
    ],
    structuredContent: {
      notes: notes.value,
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
    return createError(`Failed to fetch details for commit ${input.id}: ${(commit.reason as GitbeakerRequestError).message}`)
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
  const note = await settle(gitlab.MergeRequestNotes.create(
    projectId,
    input.iid,
    appendAIReviewFooter(input.note),
  ))
  if (note.status === 'rejected') {
    return createError(`Failed to add note to merge request !${input.iid}: ${(note.reason as GitbeakerRequestError).message}`)
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
    return createError(`Failed to fetch merge request !${input.iid}: ${(mergeRequest.reason as GitbeakerRequestError).message}`)
  }

  const { diff_refs } = mergeRequest.value
  // Remove leading ./ or / from file path
  const filePath = input.filePath.replace(/^(\.\/|\/)/, '')
  const filePathSha = sha1(filePath)
  const position: DiscussionNotePositionOptions = {
    positionType: 'text',
    baseSha: diff_refs.base_sha,
    headSha: diff_refs.head_sha,
    startSha: diff_refs.start_sha,
    newPath: filePath,
    oldPath: filePath,
  }

  const diffs = await settle(getMergeRequestDiffs(input.iid))
  if (diffs.status === 'rejected') {
    return createError(`Failed to fetch diffs for merge request !${input.iid}: ${(diffs.reason as GitbeakerRequestError).message}`)
  }

  const targetDiff = diffs.value.find(d => d.new_path === filePath || d.old_path === filePath)
  if (!targetDiff) {
    return createError(`File ${filePath} not found in merge request !${input.iid}`)
  }

  const parsedDiff = parseDiff(targetDiff.diff)[0]
  if (input.added) {
    const nearestNormalStart = getNearestNormalLineBeforeAddition(parsedDiff, input.position.start)
    position.newLine = String(input.position.end)
    position.oldLine = ''
    position.lineRange = {
      start: {
        type: 'new',
        lineCode: `${filePathSha}_${nearestNormalStart}_${input.position.start}`,
        newLine: input.position.start,
        oldLine: undefined,
      },
      end: {
        type: 'new',
        lineCode: `${filePathSha}_${nearestNormalStart}_${input.position.end}`,
        newLine: input.position.end,
        oldLine: undefined,
      },
    }
  } else {
    const nearestNormalStart = getNearestNormalLineBeforeDeletion(parsedDiff, input.position.start)
    position.oldLine = String(input.position.end)
    position.newLine = ''
    position.lineRange = {
      start: {
        type: 'old',
        lineCode: `${filePathSha}_${input.position.start}_${nearestNormalStart}`,
        newLine: undefined,
        oldLine: input.position.start,
      },
      end: {
        type: 'old',
        lineCode: `${filePathSha}_${input.position.end}_${nearestNormalStart}`,
        newLine: undefined,
        oldLine: input.position.end,
      },
    }
  }

  const note = await settle(gitlab.MergeRequestDiscussions.create(
    projectId,
    input.iid,
    appendAIReviewFooter(input.note),
    { position },
  ))
  if (note.status === 'rejected') {
    return createError(`Failed to add note to merge request !${input.iid} for file ${filePath}: ${(note.reason as GitbeakerRequestError).message}`)
  }

  server.sendLoggingMessage({
    level: 'debug',
    data: `Added note to merge request !${input.iid} for file ${filePath} with ID ${note.value.id}.`,
  }, extra.sessionId)

  return {
    content: [
      {
        type: 'text',
        text: `Note added to merge request !${input.iid} for file ${filePath}: ${note.value.body}`,
      },
    ],
    structuredContent: { note: note.value },
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('Teleskop GitLab MCP server running on stdio')
