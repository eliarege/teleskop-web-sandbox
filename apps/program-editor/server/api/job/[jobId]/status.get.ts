import { JobManager } from '~/server/utils/JobManager'

export default defineAuthEventHandler({
  roles: ['machine-upload'],
  handler: async (event) => {
    const { jobId } = getRouterParams(event)

    if (!jobId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID is required',
      })
    }

    const job = JobManager.getJob(jobId)

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found',
      })
    }

    return job
  },
})
