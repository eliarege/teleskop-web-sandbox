import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import {
  addBatchNote,
  deleteEvent,
  deleteNote,
  getBatchNotes,
  getErpParameteres,
  getMachines,
  getPlanParameters,
  getPlannedEvents,
  getRecipe,
  getUnplannedEvents,
  removeFromPlan,
} from './queries'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/planning_board/unscheduled_events',
    async (request: FastifyRequest<{
      Querystring: { from: string; to: string }
    }>, reply) => {
      try {
        const { from, to } = request.query
        const unplannedEvents = await getUnplannedEvents(from, to)
        return reply.code(200).send(unplannedEvents)
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(`Error fetching recipe: ${err.message}`)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(`Error fetching recipe: ${err.message}`)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(`Error fetching recipe: ${err.message}`)
        return reply.code(500).send({ error: 'Internal Server Error' })
      }
    },
  )
  fastify.get(
    '/planning_board/machines',
    async (request, reply) => {
      try {
        return await getMachines()
      } catch (err) {
        fastify.log.error(`Error fetching recipe: ${err.message}`)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        console.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
      }
    },
  )
  done()
}
