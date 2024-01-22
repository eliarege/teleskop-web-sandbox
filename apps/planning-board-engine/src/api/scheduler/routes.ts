import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import {
  addBatchNote,
  deleteEvent,
  deleteNote,
  getBatchNotes,
  getErpParameteres,
  getMachines,
  getPlanParameters,
  getPtStatus,
  getRecipe,
  getUnplannedEvents,
  removeFromPlan,
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
        return reply.code(200).send(unplannedEvents)
      } catch (err) {
        fastify.log.error(`An error occured while fetching unplanned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching unplanned events: ${err}` })
      }
    },
  )
  fastify.get(
    '/planning_board/recipe',
    async (request: FastifyRequest<{ Querystring: { machineId: string; jobOrder: string } }>, reply) => {
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
  fastify.get<{ Querystring: { machineId: number } }>(
    '/planning_board/settings/erp_parameters',
    async (request, reply) => {
      try {
        const { machineId } = request.query
        return await getErpParameteres(machineId)
      } catch (err) {
        fastify.log.error(`An error occured while fetching erp parameters: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching erp parameters: ${err}` })
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
  fastify.post<{
    Body: { jobOrder: string; note: string; showOnScreen: boolean; userId: number }
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
  fastify.delete<{
    Querystring: { id: number }
  }>(
    '/planning_board/batch_notes/delete_note',
    async (request: FastifyRequest<{ Querystring: { id: number } }>, reply) => {
      try {
        const { id } = request.query
        await deleteNote(id)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        console.error(`An error occured while deleting batch note: ${err}`)
        return reply.code(500).send({ error: `An error occured while deleting batch note: ${err}` })
      }
    },
  )
  done()
}
