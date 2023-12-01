import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { getPlannedEvents, getUnplannedEvents } from '../composables/query'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get('/planned_events', async (request: FastifyRequest<{
    Querystring: { from: string; to: string }
  }>, reply) => {
    try {
      const { from, to } = request.query
      if (!from || !to) {
        return reply.code(400).send({ error: 'Both "from" and "to" parameters are required.' })
      }
      const plannedEvents = await getPlannedEvents(from, to)
      return reply.code(200).send(plannedEvents)
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.get('/unplanned_events', async (request: FastifyRequest<{
    Querystring: { from: string; to: string }
  }>, reply) => {
    try {
      const { from, to } = request.query
      const unplannedEvents = await getUnplannedEvents(from, to)
      return reply.code(200).send(unplannedEvents)
    } catch (err) {

    }
  })
  done()
}
