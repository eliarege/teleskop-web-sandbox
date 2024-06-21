import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { compressJson } from '../../composables/helper'
import {
  addBatchNote,
  addErpParameters,
  deleteEvent,
  deleteNote,
  getBatchNotes,
  getBatchProperties,
  getColumnData,
  getDistinctErpParameters,
  getErpParameters,
  getEventTooltipParams,
  getMachines,
  getPlanParameters,
  getPtStatus,
  getRecipe,
  getTheoreticalDuration,
  getUnplannedColumns,
  getUnplannedEvents,
  pinEvent,
  removeErpParameter,
  removeFromPlan,
  scheduleEvents,
  taskValid,
  unpinEvent,
  updateBatchNote,
  updateUnplannedColumns,
  validateTaskPrograms,
} from './queries'

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
  fastify.get<{ Querystring: { planKey: number } }>(
    '/planning_board/plan_parameters',
    async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
      try {
        const { planKey } = request.query
        return await getPlanParameters(planKey)
      } catch (err) {
        fastify.log.error(`An error occured while fetching plan parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching plan parameters: ${err}` })
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
  fastify.get<{ Querystring: { machineId?: number, distinct?: boolean } }>(
    '/planning_board/settings/erp_parameters',
    async (request, reply) => {
      try {
        const { machineId, distinct } = request.query
        if (distinct) {
          return await getDistinctErpParameters()
        } else if (machineId) {
          return await getErpParameters(machineId)
        } else return fastify.log.error('MISSING QUERIES')
      } catch (err) {
        fastify.log.error(`An error occured while fetching erp parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching erp parameters: ${err}` })
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
    async (request: FastifyRequest<{ Querystring: { planKey: number, machineId: number } }>, reply) => {
      try {
        const { machineId, planKey } = request.query
        const batchProperties = await getBatchProperties(machineId, planKey)
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
  fastify.put<{ Body: { planKey: number, machineId: number, plannedStartTime: string, queueNumber: number }[] }>(
    '/planning_board/schedule_events',
    async (request, reply) => {
      try {
        const body = request.body
        await scheduleEvents(body)
      } catch (err) {
        fastify.log.error(`An error occured while scheduling events: ${err}`)
        return reply.code(500).send({ error: `An error occured while scheduling events: ${err}` })
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
  done()
}
