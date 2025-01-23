import type { H3Event } from 'h3'
import alarmsGet from './alarms.get'
import interventionsGet from './interventions.get'
import batchInfoGet from './info.get'
import theoreticalProgramsGet from './theoretical-programs.get'
import ioGet from './io.get'
import batchParametersGet from './batch-parameters.get'
import machineGet from './machine.get'
import actualCommandsGet from './actual-commands.get'
import mergedCommandsGet from './merged-commands.get'
import { taskManager } from '~/server/taskManager'
import type { Batch } from '~/types/archive'
import { last } from '~/server/utils/functions'

const tasks: Array<{ message: string, method: (event: H3Event, result: any) => Promise<void> }> = [
  {
    message: 'Loading Machine Info',
    method: async (event, result) => {
      const machine = await machineGet(event)
      result.machine = machine
    },
  },
  {
    message: 'Loading Job Order Info',
    method: async (event, result) => {
      const joborderInfo = await batchInfoGet(event)
      result.joborderInfo = joborderInfo
    },
  },
  {
    message: 'Loading Batch Parameters',
    method: async (event, result) => {
      result.batchParameters = await batchParametersGet(event)
    },
  },
  {
    message: 'Loading Interventions',
    method: async (event, result) => {
      result.interventions = await interventionsGet(event)
    },
  },
  {
    message: 'Loading Alarms',
    method: async (event, result) => {
      result.alarms = await alarmsGet(event)
    },
  },
  {
    message: 'Loading Actual Commands',
    method: async (event, result) => {
      result.actualCommands = await actualCommandsGet(event)
    },
  },
  {
    message: 'Loading Merged Commands',
    method: async (event, result) => {
      result.mergedCommands = await mergedCommandsGet(event)
    },
  },
  {
    message: 'Loading Theoretical Programs',
    method: async (event, result) => {
      result.theoreticalPrograms = await theoreticalProgramsGet(event)
    },
  },
  {
    message: 'Loading I/O Values',
    method: async (event, result: Batch) => {
      const ios = await ioGet(event)
      Object.assign(result, ios)
      const lastInterventionDate = last(result.interventions)?.time
      result.lastRecordDate = ios.lastRecordDate || lastInterventionDate || new Date()
    },
  },
]

export default defineEventHandler(async (event) => {
  return taskManager.createTask(event, {
    maxSteps: tasks.length,
    async handler(step) {
      const result = {}
      for (const task of tasks) {
        if (step.isCancelled()) {
          return
        }

        step.next({ message: task.message })
        await task.method(event, result)
      }

      return result
    },
  })
})
