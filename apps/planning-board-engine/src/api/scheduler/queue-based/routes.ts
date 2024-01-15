import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { generateEventDates } from '../../../composables/helper'
import {
  getQueueBasedPlannedEvents,
  getQueueBasedTheoreticalDuration,
  isTaskValidQueueBased,
  scheduleQueueBasedEvents,
  updateQueueBasedEvents,
} from './queries'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/queue_based/scheduled_events',
    async (request: FastifyRequest<{
      Querystring: { from: string; to: string }
    }>, reply) => {
      try {
        const { from, to } = request.query
        if (!from || !to) {
          return reply.code(400).send({ error: 'Both "from" and "to" parameters are required.' })
        }
        const plannedEvents = await getQueueBasedPlannedEvents(from, to)
        const a = generateEventDates(plannedEvents)
        return reply.code(200).send(a)
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(`Error fetching recipe: ${err.message}`)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(`Error fetching recipe: ${err.message}`)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
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
        console.error(err)
        return reply.code(500).send({ error: 'Internal Server Error' })
      }
    },
  )
  done()
}
