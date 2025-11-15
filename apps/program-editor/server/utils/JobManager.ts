import logger from '~/server/logger'

// Generic Job System Infrastructure

export type JobType =
  | 'copyAndSend' // Kopyala ve gönder
  | 'programUpload' // Program gönderme (cihaza upload)
  | 'programDownload' // Program alma (cihazdan download)

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface BaseJobResult {
  success: boolean
  error?: string
  timestamp: string
}

export interface GenericJob<TRequest = any, TResult extends BaseJobResult = BaseJobResult> {
  jobId: string
  type: JobType
  status: JobStatus
  createdAt: string
  completedAt?: string
  userId?: string

  // Request data
  request: TRequest

  // Progress tracking
  progress: {
    total: number
    completed: number
    percentage: number
  }

  // Results
  results: TResult[]
  errors: string[]

  // Summary
  summary: {
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    [key: string]: any // Extensible for job-specific metrics
  }

  // Metadata
  metadata?: {
    estimatedDuration?: number
    priority?: 'low' | 'normal' | 'high'
    tags?: string[]
    [key: string]: any
  }
}

// Job Store - In-memory for now, can be Redis/DB later
const jobStore = new Map<string, GenericJob>()

// Simple UUID generator
function generateJobId(type: JobType): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return `${type}_${timestamp}_${random}`
}

// Generic Job Manager Class
export class JobManager {
  /**
   * Create a new job
   */
  static createJob<TRequest>(
    type: JobType,
    request: TRequest,
    userId?: string,
    metadata?: GenericJob['metadata'],
  ): GenericJob<TRequest> {
    const jobId = generateJobId(type)

    const job: GenericJob<TRequest> = {
      jobId,
      type,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId,
      request,
      progress: {
        total: 0,
        completed: 0,
        percentage: 0,
      },
      results: [],
      errors: [],
      summary: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
      },
      metadata,
    }

    jobStore.set(jobId, job)

    logger.info({ jobId, type, userId }, `Created new job: ${type}`)

    return job
  }

  /**
   * Get job by ID
   */
  static getJob(jobId: string): GenericJob | undefined {
    return jobStore.get(jobId)
  }

  /**
   * Update job status
   */
  static updateJob(jobId: string, updates: Partial<GenericJob>): boolean {
    const job = jobStore.get(jobId)
    if (!job)
      return false

    Object.assign(job, updates)

    // Auto-calculate percentage
    if (updates.progress) {
      job.progress.percentage = job.progress.total > 0
        ? Math.round((job.progress.completed / job.progress.total) * 100)
        : 0
    }

    jobStore.set(jobId, job)
    return true
  }

  /**
   * Add result to job
   */
  static addResult(jobId: string, result: BaseJobResult): boolean {
    const job = jobStore.get(jobId)
    if (!job)
      return false

    job.results.push(result)
    job.progress.completed++

    if (result.success) {
      job.summary.successfulOperations++
    } else {
      job.summary.failedOperations++
    }

    // Update percentage
    job.progress.percentage = job.progress.total > 0
      ? Math.round((job.progress.completed / job.progress.total) * 100)
      : 0

    jobStore.set(jobId, job)
    return true
  }

  /**
   * Complete job
   */
  static completeJob(jobId: string, status: 'completed' | 'failed' = 'completed'): boolean {
    const job = jobStore.get(jobId)
    if (!job)
      return false

    job.status = status
    job.completedAt = new Date().toISOString()

    // Ensure percentage is 100% if completed
    if (status === 'completed') {
      job.progress.percentage = 100
    }

    jobStore.set(jobId, job)

    logger.info({ jobId, status, duration: this.getJobDuration(job) }, `Job ${status}: ${job.type}`)

    return true
  }

  /**
   * Get job duration
   */
  static getJobDuration(job: GenericJob): number {
    if (!job.completedAt)
      return 0
    return new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()
  }

  /**
   * Get all jobs by type
   */
  static getJobsByType(type: JobType): GenericJob[] {
    return Array.from(jobStore.values()).filter(job => job.type === type)
  }

  /**
   * Get all jobs by user
   */
  static getJobsByUser(userId: string): GenericJob[] {
    return Array.from(jobStore.values()).filter(job => job.userId === userId)
  }

  /**
   * Cleanup old completed jobs
   */
  static cleanupCompletedJobs(maxAgeHours: number = 24): number {
    const now = new Date()
    const maxAge = maxAgeHours * 60 * 60 * 1000
    let cleaned = 0

    for (const [jobId, job] of jobStore.entries()) {
      if (job.completedAt) {
        const completedTime = new Date(job.completedAt).getTime()
        if (now.getTime() - completedTime > maxAge) {
          jobStore.delete(jobId)
          cleaned++
        }
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned, maxAgeHours }, 'Cleaned up old jobs')
    }

    return cleaned
  }

  /**
   * Get job statistics
   */
  static getJobStats(): {
    total: number
    byStatus: Record<JobStatus, number>
    byType: Record<JobType, number>
  } {
    const jobs = Array.from(jobStore.values())

    const byStatus: Record<JobStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }

    const byType: Record<string, number> = {}

    jobs.forEach((job) => {
      byStatus[job.status]++
      byType[job.type] = (byType[job.type] || 0) + 1
    })

    return {
      total: jobs.length,
      byStatus,
      byType: byType as Record<JobType, number>,
    }
  }
}

// Auto-cleanup every hour
setInterval(() => {
  JobManager.cleanupCompletedJobs()
}, 60 * 60 * 1000)

// Specific Job Result Types
export interface CopyAndSendResult extends BaseJobResult {
  machineId: number
  programNo: number
  programName: string
  machineName: string
  copySkipped: boolean // Kopyalama atlandı mı?
  copyToMachine: boolean // Makineye (veritabanına) kopyalandı mı?
  sentToDevice: boolean // Cihaza gönderildi mi?
  copyError?: string // Kopyalama hatası
  sendError?: string // Gönderme hatası
}

export interface ProgramUploadResult extends BaseJobResult {
  machineId: number
  programNo: number
  programName: string
  machineName?: string
}

export interface ProgramDownloadResult extends BaseJobResult {
  machineId: number
  programNo: number
  programName: string
  machineName?: string
}

// Export job store for backward compatibility
export { jobStore }
