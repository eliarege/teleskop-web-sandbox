import { sendNoContent } from 'h3'
import { taskManager } from '~/server/taskManager'

export default defineEventHandler((event) => {
  const status = taskManager.getTaskStatus(Number(getRouterParam(event, 'task_id')))
  if (!status)
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  return status
})
