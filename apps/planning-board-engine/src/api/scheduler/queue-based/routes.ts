import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { generateEventDates } from '../../../composables/helper'
import {
  getQueueBasedArchiveEvents,
  getQueueBasedPlannedEvents,
  getQueueBasedTheoreticalDuration,
  isTaskValidQueueBased,
  scheduleQueueBasedEvents,
  updateQueueBasedEvents,
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
        const isValid = await isTaskValidQueueBased(planKey)
        return reply.code(200).send(isValid)
      } catch (err) {
        fastify.log.error(`An error occured while fetching valid status: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching valid status: ${err}` })
      }
    },
  )
  fastify.get(
    '/queue_based/theoretical_duration',
    async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
      try {
        const { planKey } = request.query
        return await getQueueBasedTheoreticalDuration(planKey)
      } catch (err) {
        fastify.log.error(`An error occured while fetching theoretical duration: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching theoretical duration: ${err}` })
      }
    },
  )
  fastify.put<{ Body: { planKey: number; machineId: number; queueNumber: number }[] }>(
    '/queue_based/scheduled_events/update',
    async (request, reply) => {
      try {
        const body = request.body
        await updateQueueBasedEvents(body)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while updating events: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating events: ${err}` })
      }
    },
  )
  fastify.post<{
    Body: { planKey: number; machineId: number; plannedStartTime: string }
  }>(
    '/queue_based/unscheduled_events/schedule',
    async (request, reply) => {
      try {
        const { planKey, machineId, plannedStartTime } = request.body
        await scheduleQueueBasedEvents(planKey, machineId, plannedStartTime)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while adding events: ${err}`)
        return reply.code(500).send({ error: `An error occured while adding events: ${err}` })
      }
    },
  )
  done()
}
