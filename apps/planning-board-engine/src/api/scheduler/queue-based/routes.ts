import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { generateEventDates } from '../../../composables/helper'
import { isTaskValid } from '../queries'
import type {
  EventReschedule,
} from './queries'
import {
  getEvents,
  getQueueBasedArchiveEvents,
  getQueueBasedPlannedEvents,
  queueUnplannedEvents,
  updateEventQueue,
} from './queries'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/queue_based/scheduler_events',
    async (request: FastifyRequest<{
      Querystring: { startDate: string, endDate: string }
    }>, reply) => {
      try {
        const { startDate, endDate } = request.query
        const plannedEvents = await getEvents(startDate, endDate)
        // const datedPlannedEvents = generateEventDates(plannedEvents)
        return reply.code(200).send(plannedEvents)
      } catch (err) {
        fastify.log.error(`An error occured while fetching planned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching planned events: ${err}` })
      }
    },
  )
  fastify.get(
    '/queue_based/scheduled_events',
    async (request: FastifyRequest<{
      Querystring: { startDate: string, endDate: string }
    }>, reply) => {
      try {
        const { startDate, endDate } = request.query
        const plannedEvents = await getQueueBasedPlannedEvents(startDate, endDate)
        // const datedPlannedEvents = generateEventDates(plannedEvents)
        return reply.code(200).send(plannedEvents)
      } catch (err) {
        fastify.log.error(`An error occured while fetching planned events: ${err}`)
        return reply.code(500).send({ error: `An error occured while fetching planned events: ${err}` })
      }
    },
  )
  fastify.get(
    '/queue_based/archive_events',
    async (request: FastifyRequest<{
      Querystring: { startDate: string, endDate: string }
    }>, reply) => {
      try {
        const { startDate, endDate } = request.query
        const plannedEvents = await getQueueBasedArchiveEvents(startDate, endDate)
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

  fastify.put(
    '/queue_based/schedule_events',
    async (request: FastifyRequest<{ Body: { previousEventData: EventReschedule, newEventData: EventReschedule } }>, reply) => {
      try {
        const { previousEventData, newEventData } = request.body
        await updateEventQueue(previousEventData, newEventData)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while updating events: ${err}`)
        return reply.code(500).send({ error: `An error occured while updating events: ${err}` })
      }
    },
  )
  fastify.post(
    '/queue_based/schedule_unplanned_events',
    async (request: FastifyRequest<{ Body: { newEvent: EventReschedule } }>, reply) => {
      try {
        const { newEvent } = request.body
        await queueUnplannedEvents(newEvent)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occured while scheduling events: ${err}`)
        return reply.code(500).send({ error: `An error occured while scheduling events: ${err}` })
      }
    },
  )
  done()
}
