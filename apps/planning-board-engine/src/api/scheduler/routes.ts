import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { ofetch } from 'ofetch'
import { TonelloApi } from '@teleskop/core'
import {
  addBatchNote,
  addErpParameters,
  bulkAddErpParameter,
  bulkCreatePlanParameter,
  checkMachineParameterRequest,
  createPlanParameter,
  dataCleanup,
  deleteEvent,
  deleteNote,
  getAutoAdd,
  getBatchNotes,
  getBatchProperties,
  getColumnData,
  getDistinctErpParameters,
  getErpParameters,
  getEventTooltipParams,
  getFormula,
  getMachineInfo,
  getMachines,
  getMachinesByErpParameter,
  getPlanParameters,
  getPtStatus,
  getRecipe,
  getStartingParametersWithValues,
  getTheoreticalDuration,
  getUnplannedColumns,
  getUnplannedEvents,
  pinEvent,
  planningBoardStops,
  refreshCustomTables,
  removeErpParameter,
  removeFromPlan,
  scheduleEvents,
  taskValid,
  unpinEvent,
  updateAutoAdd,
  updateBatchNote,
  updatePlanParameter,
  updateUnplannedColumns,
  uploadToMachine,
  uploadToTonelloMachine,
} from './queries'
import { remoteShowMessageBody } from '~/composables/soap'
import { StartingParameters } from '~/composables/enums'
import { fetchProgram } from '~/lib/program'
import { knex } from '~/knexConfig'
import { fetchMachineInfo } from '~/lib/machine'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/planning_board/state',
    async (request, reply) => {
      try {
        const pt = await getPtStatus()
        return reply.code(200).send(pt)
      } catch (err) {
        fastify.log.error(`An error occured while fetching pt status: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching pt status: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/auto_add',
    async (request, reply) => {
      try {
        return await getAutoAdd()
      } catch (err: any) {
        fastify.log.error(`An error occured while fetching auto add status: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching auto add status: ${err}` })
      }
    },
  )
  fastify.put(
    '/planning_board/auto_add',
    async (request: FastifyRequest<{
      Body: { value: boolean }
    }>, reply) => {
      try {
        const { value } = request.body
        await updateAutoAdd(value)
        return reply.code(200).send('Successful')
      } catch (err: any) {
        fastify.log.error(`An error occured while updating auto add status: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating auto add status: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/stops',
    async (request: FastifyRequest<{ Querystring: { startDate: string, endDate: string } }>, _reply) => {
      try {
        const { startDate, endDate } = request.query
        return await planningBoardStops(startDate, endDate)
      } catch (err) {
        fastify.log.error(`An error occured while fetching stops:`, err)
      }
    },
  )
  fastify.get(
    '/planning_board/unscheduled_events',
    async (request, reply) => {
      try {
        const unplannedEvents = await getUnplannedEvents()
        return unplannedEvents
      } catch (err) {
        fastify.log.error(`An error occured while fetching unplanned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching unplanned events: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/recipe',
    async (request: FastifyRequest<{ Querystring: { machineId: string, jobOrder: string } }>, reply) => {
      try {
        const { jobOrder, machineId } = request.query
        const recipe = await getRecipe(machineId, jobOrder)
        return reply.code(200).send(recipe)
      } catch (err) {
        fastify.log.error(`An error occured while fetching recipe: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching recipe: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/batch_notes',
    async (request: FastifyRequest<{ Querystring: { jobOrder: string } }>, reply) => {
      try {
        const { jobOrder } = request.query
        return await getBatchNotes(jobOrder)
      } catch (err) {
        fastify.log.error(`An error occured while fetching batch notes: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching batch notes: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/plan_parameters',
    async (request: FastifyRequest<{
      Querystring: { planKey: number, machineId: number }
    }>, reply) => {
      try {
        const { planKey, machineId } = request.query
        return await getPlanParameters(planKey, machineId)
      } catch (err) {
        fastify.log.error(`An error occured while fetching plan parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching plan parameters: ${err}` })
      }
    },
  )
  fastify.put(
    '/planning_board/refresh_tables',
    async (request: FastifyRequest, reply) => {
      try {
        return await refreshCustomTables()
      } catch (err) {
        fastify.log.error(`An error occured while updating tables: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating tables: ${err}` })
      }
    },
  )
  fastify.put(
    '/planning_board/plan_parameters',
    async (request: FastifyRequest<{
      Querystring: { planKey: number, value: number, paramString: string }
    }>, reply) => {
      try {
        const { planKey, value, paramString } = request.query
        return await updatePlanParameter(planKey, value, paramString)
      } catch (err) {
        fastify.log.error(`An error occured while updating plan parameter: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating plan parameter: ${err}` })
      }
    },
  )
  fastify.post(
    '/planning_board/plan_parameters',
    async (request: FastifyRequest<{
      Body: { parameter: {
        paramString: string
        value?: number | string
        planKey: string
        paramLowLimit: number
        paramHighLimit: number
        paramStatus: number
      }, value: number | string, machineId: number }
    }>, reply) => {
      try {
        const { parameter, value, machineId } = request.body
        return await createPlanParameter(parameter, value, machineId)
      } catch (err) {
        fastify.log.error(`An error occured while creating plan parameter: ${err}`)
        return reply.code(500).send({ error: `An error occured while creating plan parameter: ${err}` })
      }
    },
  )

  fastify.post(
    '/planning_board/plan_parameters/bulk',
    async (request: FastifyRequest<{
      Body: {
        planKey: number
        machineId: number
        parameters: Array<{
          parameter: {
            paramString: string
            value?: number | string
            planKey: string
            paramLowLimit: number
            paramHighLimit: number
            paramStatus: number
          }
          value: number
        }>
      }
    }>, reply) => {
      try {
        const { planKey, machineId, parameters } = request.body
        return await bulkCreatePlanParameter(planKey, machineId, parameters)
      } catch (err) {
        fastify.log.error(`An error occured while bulk creating plan parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while bulk creating plan parameters: ${err}` })
      }
    },
  )

  fastify.get(
    '/planning_board/machines',
    async (request, reply) => {
      try {
        return await getMachines()
      } catch (err) {
        fastify.log.error(`An error occured while fetching machines: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching machines: ${err}` })
      }
    },
  )
  fastify.get<{ Querystring: { paramString?: string, distinct?: boolean } }>(
    '/planning_board/settings/erp_parameters',
    async (request, reply) => {
      try {
        const { paramString, distinct } = request.query
        if (distinct) {
          return await getDistinctErpParameters()
        } else if (paramString) {
          return await getErpParameters(paramString)
        } else return fastify.log.error('MISSING QUERIES')
      } catch (err) {
        fastify.log.error(`An error occured while fetching erp parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching erp parameters: ${err}` })
      }
    },
  )
  fastify.get <{ Querystring: { paramString: string } }>(
    '/planning_board/settings/machines_by_erp_parameter',
    async (request, reply) => {
      try {
        const { paramString } = request.query
        return await getMachinesByErpParameter(paramString)
      } catch (err) {
        fastify.log.error(`An error occured while fetching machines ids ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching machine ids: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/columns/unplanned_columns',
    async (request, reply) => {
      try {
        return await getUnplannedColumns()
      } catch (err) {
        fastify.log.error(`An error occured while fetching columns: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching columns: ${err}` })
      }
    },
  )
  fastify.get<{ Querystring: { planKey?: number } }>(
    '/planning_board/columns/column_data',
    async (request, reply) => {
      try {
        return await getColumnData(request.query.planKey)
      } catch (err) {
        fastify.log.error(`An error occured while fetching column data: ${err}`)
        return reply.code(500).send({ error: `An error occured while column data: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/valid',
    async (request: FastifyRequest<{ Querystring: { planKey: number, fabricWeight: number } }>, reply) => {
      try {
        const { planKey, fabricWeight } = request.query
        const isValid = await taskValid(planKey, fabricWeight)
        return reply.code(200).send(isValid)
      } catch (err) {
        fastify.log.error(`An error occured while fetching valid status: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching valid status: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/event_tooltip',
    async (request: FastifyRequest<{ Querystring: { planKey: number, machineId: number } }>, reply) => {
      try {
        const { machineId, planKey } = request.query
        const tooltipParams = await getEventTooltipParams(planKey, machineId)
        return reply.code(200).send(tooltipParams)
      } catch (err) {
        fastify.log.error(`An error occured while fetching tooltip parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching tooltip parameters: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/batch_properties',
    async (request: FastifyRequest<{ Querystring: { planKey: number, machineId: number, isActual?: string, batchKey?: number } }>, reply) => {
      try {
        const isActual = request.query.isActual === 'true'
        const { machineId, planKey, batchKey } = request.query

        const batchProperties = await getBatchProperties(machineId, planKey, isActual, batchKey)
        return reply.code(200).send(batchProperties)
      } catch (err) {
        fastify.log.error(`An error occured while fetching batch properties: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching batch properties: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/theoretical_duration',
    async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
      try {
        const { planKey } = request.query
        return await getTheoreticalDuration(planKey)
      } catch (err) {
        fastify.log.error(`An error occured while fetching theoretical duration: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching theoretical duration: ${err}` })
      }
    },
  )

  fastify.get(
    '/planning_board/program_details',
    async (request: FastifyRequest<{ Querystring: { programNo: number, machineId: number } }>, reply) => {
      try {
        const { programNo, machineId } = request.query
        return await fetchProgram(knex, programNo, machineId)
      } catch (err) {
        fastify.log.error(`An error occured while fetching detailed program: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching detailed program: ${err}` })
      }
    },
  )
  fastify.put<{
    Body: { noteKey: number, showOnScreen: boolean }
  }>(
    '/planning_board/batch_notes/update_note',
    async (request, reply) => {
      try {
        const { noteKey, showOnScreen } = request.body
        await updateBatchNote(noteKey, showOnScreen)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while updating batch note: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating batch note: ${err}` })
      }
    },
  )
  fastify.put<{ Querystring: { planKey: number } }>(
    '/planning_board/unplan',
    async (request, reply) => {
      try {
        const { planKey } = request.query
        await removeFromPlan(planKey)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while removing event from plan: ${err}`)
        return reply.code(500).send({ error: `An error occured while removing event from plan: ${err}` })
      }
    },
  )
  fastify.put<{ Querystring: { planKey: number } }>(
    '/planning_board/delete',
    async (request, reply) => {
      try {
        const { planKey } = request.query
        await deleteEvent(planKey)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while deleting event: ${err}`)
        return reply.code(500).send({ error: `An error occured while deleting event: ${err}` })
      }
    },
  )
  fastify.put<{ Querystring: { planKey: number } }>(
    '/planning_board/pin_event',
    async (request, reply) => {
      try {
        const { planKey } = request.query
        await pinEvent(planKey)
      } catch (err) {
        fastify.log.error(`An error occured while pinning event: ${err}`)
        return reply.code(500).send({ error: `An error occured while pinning event: ${err}` })
      }
    },
  )
  fastify.put<{ Querystring: { planKey: number } }>(
    '/planning_board/unpin_event',
    async (request, reply) => {
      try {
        const { planKey } = request.query
        await unpinEvent(planKey)
      } catch (err) {
        fastify.log.error(`An error occured while unpinning event: ${err}`)
        return reply.code(500).send({ error: `An error occured while unpinning event: ${err}` })
      }
    },
  )
  fastify.put<{ Body: { id: number, visible: boolean } }>(
    '/planning_board/columns/unplanned_columns',
    async (request, reply) => {
      try {
        const { id, visible } = request.body
        await updateUnplannedColumns(id, visible)
      } catch (err) {
        fastify.log.error(`An error occured while updating columns: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating columns: ${err}` })
      }
    },
  )

  fastify.put('/planning_board/data_cleanup', async (_request, reply) => {
    try {
      await dataCleanup()
    } catch (err) {
      fastify.log.error(`An error occured while data clenaup: ${err}`)
      return reply.code(500).send({ error: `An error occured while data clenaup: ${err}` })
    }
  })

  fastify.post<{
    Body: { jobOrder: string, note: string, showOnScreen: boolean, userId: number }
  }>(
    '/planning_board/batch_notes/add_note',
    async (request, reply) => {
      try {
        const { jobOrder, note, userId, showOnScreen } = request.body
        await addBatchNote(jobOrder, note, userId, showOnScreen)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while adding batch note: ${err}`)
        return reply.code(500).send({ error: `An error occured while adding batch note: ${err}` })
      }
    },
  )
  fastify.post<{
    Body: { id: number, machineId: number }
  }>(
    '/planning_board/erp_parameters/add_parameter',
    async (request, reply) => {
      try {
        const { machineId, id } = request.body
        await addErpParameters(id, machineId)
        return reply.code(200).send('Succesful')
      } catch (err) {
        fastify.log.error(`An error occured while adding erp parameter: ${err}`)
        return reply.code(500).send({ error: `An error occured while adding erp parameter: ${err}` })
      }
    },
  )

  fastify.put<{
    Body: { paramString: string, machines: number[] }
  }>(
    '/planning_board/erp_parameters/bulk_add_parameter',
    async (request, reply) => {
      try {
        const { paramString, machines } = request.body
        await bulkAddErpParameter(paramString, machines)
        return reply.code(200).send('Succesful')
      } catch (err) {
        fastify.log.error(`An error occured while adding erp parameter: ${err}`)
        return reply.code(500).send({ error: `An error occured while adding erp parameter: ${err}` })
      }
    },
  )

  fastify.delete<{
    Querystring: { id: number }
  }>(
    '/planning_board/batch_notes/note',
    async (request: FastifyRequest<{ Querystring: { id: number } }>, reply) => {
      try {
        const { id } = request.query
        await deleteNote(id)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        console.error(`An error occured while deleting batch note: `, err)
        return reply.code(500).send({ error: `An error occured while deleting batch note: ${err}` })
      }
    },
  )
  fastify.put(
    '/planning_board/erp_parameters/parameter',
    async (request: FastifyRequest<{
      Querystring: { id: number, machineId: number }
    }>, reply) => {
      try {
        const { id, machineId } = request.query
        await removeErpParameter(id, machineId)
        return reply.code(200).send('Succesful')
      } catch (err) {
        console.error(`An error occured while deleting erp parameter: `, err)
        return reply.code(500).send({ error: `An error occured while deleting erp parameter: ${err}` })
      }
    },
  )
  /* ------------------------------------------------------------------------------------------------------------------------ */
  fastify.post('/planning_board/send_message', async (request: FastifyRequest<{
    Body?: { machineId: number, title: string, message: string }
  }>, reply) => {
    try {
      const body = request.body
      if (!body
        || typeof body.machineId !== 'number'
        || typeof body.title !== 'string'
        || typeof body.message !== 'string'
      ) {
        return reply.code(400).send('Invalid request body')
      }

      const machine = await fetchMachineInfo(knex, body.machineId)
      if (!machine) {
        return reply.code(404).send('Machine not found')
      }

      await ofetch(`http://${machine.host}:8080`, {
        method: 'POST',
        body: remoteShowMessageBody(body.title, body.message),
      })
      return reply.code(200).send('Successful')
    } catch (err) {
      console.error('An error occured while sending message to machine', err)
      return reply.code(500).send({ error: `An error occured while sending message to machine: ${err}` })
    }
  })
  fastify.put(
    '/planning_board/upload_joborder',
    async (request: FastifyRequest<{
      Querystring: { program: string, machineId: number, planKey: number, machineIp: string, jobOrder: string }
    }>, reply) => {
      try {
        // TODO: program is apparently a comma-separated list of programs? better rename the variable
        const { program, machineId, planKey, jobOrder } = request.query
        // check if machine wants all params
        const allParamsRequired = await checkMachineParameterRequest(machineId)
        if (allParamsRequired) {
          const allParams = await getPlanParameters(planKey, machineId)
          if (allParams.every(p => p.paramStatus === StartingParameters.Correct)) {
            await uploadToMachine(machineIp, allParams, program, jobOrder)
            return reply.code(200).send('DONE')
          } else return allParams
        } else {
          const formula = await getFormula(program, machineId)
          if (formula.length > 0) {
            const startingParameterValues = await getStartingParametersWithValues(formula, planKey)
            const requestedStartingParameters = startingParameterValues.filter(ev => ev.value === null)

            if (requestedStartingParameters.every(e => e.paramStatus === StartingParameters.Correct) || requestedStartingParameters.length === 0) {
              // write to machine
              const machineInfo = await fetchMachineInfo(knex, machineId)
              if (!machineInfo) {
                return reply.code(404).send('Machine not found')
              }
              const programNoList = program.split(',').map(prgNo => Number.parseInt(prgNo))
              if (programNoList.some(Number.isNaN)) {
                return reply.code(400).send('Invalid program number format')
              }

              if (machineInfo.tbbModel !== 'Tonello') {
                await uploadToMachine(machineInfo.host, startingParameterValues, programNoList, jobOrder)
              } else {
                const tonelloApi = TonelloApi.createFromHostname(machineInfo.host)
                await uploadToTonelloMachine(machineInfo.machineId, tonelloApi, programNoList, jobOrder)
              }
              return reply.code(200).send('DONE')
            }
            return reply.code(200).send(startingParameterValues)
          } else return reply.code(200).send('NO PARAMETER')
        }
      } catch (err) {
        console.error(err)
        return reply.code(500).send({ error: `An error occured while uploading to machine: ${err}` })
      }
    },
  )
  done()
}
