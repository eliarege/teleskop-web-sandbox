import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import type { TimeBasedArchiveEvents, TimeBasedEvents, TimeBasedPlannedEvents } from '../../../../types/planning-board'
import { updateTimeBasedEventStates } from './helper'
import {
  getTimeBasedEvents,
  getTimeBasedPlannedEvents,
} from './queries'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/time_based/scheduled_events',
    async (request: FastifyRequest<{ Querystring: { archiveDays: string } }>, reply) => {
      try {
        const { archiveDays } = request.query
        const plannedEvents: TimeBasedPlannedEvents[] = await getTimeBasedPlannedEvents()
        const archiveEvents: TimeBasedArchiveEvents[] = await getTimeBasedEvents(Number.parseInt(archiveDays))
        const events: TimeBasedEvents = { plannedEvents, archiveEvents }
        return updateTimeBasedEventStates(events)
      } catch (err) {
        fastify.log.error(`An error occured while fetching planned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching planned events: ${err}` })
      }
    },
  )
  done()
}
