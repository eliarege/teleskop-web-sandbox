import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import type { TimeBasedArchiveEvents, TimeBasedEvents, TimeBasedPlannedEvents } from '../../../../types/planning-board'
import {
  getTimeBasedEvents,
  getTimeBasedPlannedEvents,
  getTimeBasedTheoreticalDuration,
  scheduleTimeBasedEvents,
  updateTimeBasedEvents,
} from './queries'
import { updateTimeBasedEventStates } from './helper'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/time_based/scheduled_events',
    async (request: FastifyRequest<{ Querystring: { archiveDays: string } }>, reply) => {
      try {
        const { archiveDays } = request.query
        const plannedEvents: TimeBasedPlannedEvents[] = await getTimeBasedPlannedEvents()
        const archiveEvents: TimeBasedArchiveEvents[] = await getTimeBasedEvents(Number.parseInt(archiveDays))
        const events: TimeBasedEvents = { plannedEvents, archiveEvents }
        return reply.code(200).send(updateTimeBasedEventStates(events))
      } catch (err) {
        fastify.log.error(`An error occured while fetching planned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching planned events: ${err}` })
      }
    },
  )
  fastify.get(
    '/time_based/theoretical_duration',
    async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
      try {
        const { planKey } = request.query
        return await getTimeBasedTheoreticalDuration(planKey)
      } catch (err) {
        fastify.log.error(`An error occured while fetching theoretical duration: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching theoretical duration: ${err}` })
      }
    },
  )

  fastify.put<{ Body: { planKey: number, machineId: number, plannedStartTime: string } }>(
    '/time_based/scheduled_events/update',
    async (request, reply) => {
      try {
        const { planKey, machineId, plannedStartTime } = request.body
        await updateTimeBasedEvents(planKey, machineId, plannedStartTime)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while updating events: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating events: ${err}` })
      }
    },
  )

  fastify.post<{
    Body: { planKey: number, machineId: number, plannedStartTime: string }
  }>(
    '/time_based/unscheduled_events/schedule',
    async (request, reply) => {
      try {
        const { planKey, machineId, plannedStartTime } = request.body
        await scheduleTimeBasedEvents(planKey, machineId, plannedStartTime)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while adding events: ${err}`)
        return reply.code(500).send({ error: `An error occured while adding events: ${err}` })
      }
    },
  )
  done()
}
