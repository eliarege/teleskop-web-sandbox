import type { MachineController } from '../classes/MachineController'
import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'
import { type CopyAndSendResult, JobManager } from '~/server/utils/JobManager'
import { ProgramStatus } from '~/shared/constants'
import type { MachineInfo, PasteOptions, Program } from '~/shared/types'

interface CopyAndSendRequest {
  programs: {
    programNo: number
    name: string
  }[]
  sourceMachineId: number
  targetMachines: MachineInfo[]
  pasteOption: PasteOptions
}

export default defineAuthEventHandler({
  roles: ['machine-upload'],
  handler: async (event) => {
    const body = await readBody<CopyAndSendRequest>(event)
    const { programs, sourceMachineId, targetMachines, pasteOption } = body

    // Validasyon
    if (!Array.isArray(programs) || programs.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid programs array',
      })
    }

    if (!Array.isArray(targetMachines) || targetMachines.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid target machines array',
      })
    }

    // Kaynak makineyi kontrol et
    const sourceMachine = await machineStore.get(sourceMachineId)
    if (!sourceMachine) {
      throw createError({
        statusCode: 404,
        statusMessage: `Source machine ${sourceMachineId} not found`,
      })
    }

    // Hedef makinelerin varlığını kontrol et
    const validTargetMachines: { id: number, name: string }[] = []
    for (const { id: targetId, name: targetName } of targetMachines) {
      if (targetId === sourceMachineId) {
        continue // Kaynak makineye kopyalama yapılmaz
      }

      const targetMachine = await machineStore.get(targetId)
      if (targetMachine) {
        validTargetMachines.push({ id: targetId, name: targetName })
      }
    }

    if (validTargetMachines.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid target machines found',
      })
    }

    // Generic Job Manager kullanarak job oluştur
    const totalOperations = programs.length * validTargetMachines.length

    const job = JobManager.createJob(
      'copyAndSend',
      { programs, targetMachines: validTargetMachines },
      event.context.kauth?.name,
      {
        estimatedDuration: totalOperations * 1000, // Rough estimate
        priority: 'normal',
      },
    )

    // Progress total'ı set et
    JobManager.updateJob(job.jobId, {
      progress: { total: totalOperations, completed: 0, percentage: 0 },
    })

    logger.info(`User: ${event.context.kauth?.name}. Started copy and send job ${job.jobId} for ${programs.length} programs to ${validTargetMachines.length} machines.`)

    // Async olarak işlemi başlat
    processCopyAndSendJob(job.jobId, sourceMachine, validTargetMachines, programs, pasteOption)
      .catch((error) => {
        logger.error({ error, jobId: job.jobId }, 'Copy and send job failed')
        JobManager.completeJob(job.jobId, 'failed')
        JobManager.updateJob(job.jobId, {
          errors: [`Unexpected error: ${error.message}`],
        })
      })

    return { jobId: job.jobId }
  },
})

async function processCopyAndSendJob(
  jobId: string,
  sourceMachine: MachineController,
  targetMachines: { id: number, name: string }[],
  programs: { programNo: number, name: string }[],
  pasteOption: PasteOptions,
) {
  // Job durumunu running'e çevir
  JobManager.updateJob(jobId, { status: 'running' })

  const errMessage = (msg: string, error: unknown) => {
    return `${msg}: ${error instanceof Error ? error.message : 'Unknown error'}`
  }

  try {
    // Her hedef makine için
    for (const { id: targetId, name: targetName } of targetMachines) {
      const targetMachine = await machineStore.get(targetId)
      if (!targetMachine)
        continue

      const tryCopyAndSend = async (programInfo: { programNo: number, name: string }): Promise<CopyAndSendResult> => {
        // We will construct the result and return it
        const result: CopyAndSendResult = {
          success: false,
          // Will will set actual timestamp when operation is done
          timestamp: '',
          machineId: targetId,
          programNo: programInfo.programNo,
          programName: programInfo.name,
          machineName: targetName,
          copySkipped: false,
          copyToMachine: false,
          sentToDevice: false,
        }
        let program: Program | undefined

        try {
          const { program: fetchedProgram } = await sourceMachine.fetchProgram(programInfo.programNo)
          program = fetchedProgram
        } catch (error) {
          result.copyError = errMessage('Failed to fetch program', error)
          return result
        }

        const targetHasProgram = await targetMachine.hasProgram(programInfo.programNo)
        result.copySkipped = pasteOption === 'skip' && targetHasProgram
        if (result.copySkipped) {
          logger.debug(`Copy skipped for program ${programInfo.programNo} to machine ${targetId} as it already exists and paste option is 'skip'`)
        }

        if (!result.copySkipped) {
          try {
            if (targetHasProgram) {
              await targetMachine.updateProgram(program)
            } else {
              await targetMachine.insertProgram(program)
            }
            result.copyToMachine = true
          } catch (error) {
            if (targetHasProgram) {
              result.copyError = errMessage(`Failed to overwrite program`, error)
            } else {
              result.copyError = errMessage(`Failed to copy to machine`, error)
            }
            return result
          }
        }

        let targetProgram: Program | undefined
        try {
          const { program } = await targetMachine.fetchProgram(programInfo.programNo)
          targetProgram = program
        } catch (error) {
          result.copyError = errMessage(result.copySkipped
            ? `Failed to verify existing program on target machine`
            : `Failed to verify copied program`, error)
          return result
        }

        try {
          await targetMachine.uploadProgram(targetProgram)
        } catch (error) {
          result.sendError = errMessage(`Failed to upload program to machine`, error)
          return result
        }

        targetProgram.isChanged = false
        targetProgram.prgState = ProgramStatus.EXISTS_ON_BOTH
        targetProgram.updatedAtTBB = targetProgram.updatedAt
        await targetMachine.updateProgramHeader(targetProgram)

        result.sentToDevice = true
        result.success = true
        return result
      }

      for (const programInfo of programs) {
        const result = await tryCopyAndSend(programInfo)
        result.timestamp = new Date().toISOString()
        if (!result.success) {
          result.error = result.copyError || result.sendError || 'Unknown error'
          logger.error({
            error: result.error,
            programNo: programInfo.programNo,
            targetId,
          }, `Failed to copy and send program ${programInfo.programNo} to machine ${targetId}`)
        } else {
          logger.info(`Successfully copied and sent program ${programInfo.programNo} to machine ${targetId}`)
        }

        JobManager.addResult(jobId, result)
      }
    }

    // Job'ı tamamla
    JobManager.completeJob(jobId, 'completed')

    logger.info(`Copy and send job ${jobId} completed successfully`)
  } catch (error) {
    // Job'ı failed olarak işaretle
    JobManager.completeJob(jobId, 'failed')
    JobManager.updateJob(jobId, {
      errors: [`Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    })
    logger.error({ error, jobId }, 'Copy and send job failed')
  }
}
