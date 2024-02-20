import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { generateEventDates } from '../../../composables/helper'
import { isTaskValid } from '../queries'
import {
  getQueueBasedArchiveEvents,
  getQueueBasedPlannedEvents,
} from './queries'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/queue_based/scheduled_events',
    async (request, reply) => {
      try {
        const plannedEvents = await getQueueBasedPlannedEvents()
        const datedPlannedEvents = generateEventDates(plannedEvents)
        return reply.code(200).send(datedPlannedEvents)
      } catch (err) {
        fastify.log.error(`An error occured while fetching planned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching planned events: ${err}` })
      }
    },
  )
  fastify.get(
    '/queue_based/archive_events',
    async (request: FastifyRequest<{
      Querystring: { archiveDays: string }
    }>, reply) => {
      try {
        const { archiveDays } = request.query
        const plannedEvents = await getQueueBasedArchiveEvents(Number.parseInt(archiveDays))
        return reply.code(200).send(plannedEvents)
      } catch (err) {
        fastify.log.error(`An error occured while fetching archive events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching archive events: ${err}` })
      }
    },
  )
  fastify.get(
    '/queue_based/valid',
    async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
      try {
        const { planKey } = request.query
        const isValid = await isTaskValid(planKey)
        return reply.code(200).send(isValid)
      } catch (err) {
        fastify.log.error(`An error occured while fetching valid status: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching valid status: ${err}` })
      }
    },
  )
  done()
}
