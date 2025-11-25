import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import type { ValidatedPlanParameter } from 'types/planning-board'
import { getEveryPlanParameter, getPlanParameters, getRequiredStartingParametersForPrograms, getStartingParametersWithValues, isEveryStartParameterRequired } from '../queries'
import type {
  EventReschedule,
} from './queries'
import {
  getFullQueueBasedEvents,
  getQueueBasedEvents,
  getQueueBasedPlannedEvents,
  preplanJoborders,
  queueUnplannedEvent,
  scheduleFutureEvents,
  updateEventQueue,
} from './queries'
import { StartingParameters } from '~/composables/enums'
import { getMachineInfo, isTonello } from '~/lib/machine'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get(
    '/queue_based/scheduler_events',
    async (request: FastifyRequest<{
      Querystring: { startDate: string, endDate: string, includeStops: string }
    }>, reply) => {
      try {
        const { startDate, endDate, includeStops } = request.query
        const stopsIncluded: boolean = JSON.parse(includeStops.toLowerCase())
        const plannedEvents = (await getQueueBasedEvents(startDate, endDate, stopsIncluded))
        return reply.code(200).send(plannedEvents)
      } catch (err) {
        fastify.log.error(`An error occurred while fetching planned events: ${err}`)
        return reply.code(500).send({ error: `An error occurred while fetching planned events: ${err}` })
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
        return reply.code(200).send(plannedEvents)
      } catch (err) {
        fastify.log.error(`An error occurred while fetching events: ${err}`)
        return reply.code(500).send({ error: `An error occurred while fetching events: ${err}` })
      }
    },
  )
  fastify.get('/queue_based/all_scheduled_events', async (request, reply) => {
    try {
      const events = await getFullQueueBasedEvents()
      return reply.code(200).send(events)
    } catch (err) {
      fastify.log.error(`An error occurred while fetching events: ${err}`)
      return reply.code(500).send({ error: `An error occurred while fetching events: ${err}` })
    }
  })

  fastify.put(
    '/queue_based/schedule_events',
    async (request: FastifyRequest<{ Body: { previousEventData: EventReschedule, newEventData: EventReschedule } }>, reply) => {
      try {
        const { previousEventData, newEventData } = request.body
        await updateEventQueue(previousEventData, newEventData)
        return reply.code(200).send('Succesful!')
      } catch (err) {
        fastify.log.error(`An error occurred while updating events: ${err}`)
        return reply.code(500).send({ error: `An error occurred while updating events: ${err}` })
      }
    },
  )
  fastify.post(
    '/queue_based/auto_plan',
    async (_request, reply) => {
      try {
        return await preplanJoborders(fastify)
      } catch (err) {
        fastify.log.error(`An error occurred while auto planning events: ${err}`)
        return reply.code(500).send({ error: `An error occurred while auto planning events: ${err}` })
      }
    },
  )
  fastify.post(
    '/queue_based/schedule_future_events',
    async (request: FastifyRequest<{ Body: { newEvent: { planKey: number, machineId: number } } }>, reply) => {
      try {
        const { newEvent } = request.body
        await scheduleFutureEvents(newEvent)
        return reply.code(200).send('DONE')
      } catch (err) {
        fastify.log.error(`An error occurred while updating events: ${err}`)
        return reply.code(500).send({ error: `An error occurred while updating events: ${err}` })
      }
    },
  )
  fastify.post(
    '/queue_based/schedule_unplanned_events',
    async (request: FastifyRequest<{ Body: { newEvent: EventReschedule } }>, reply) => {
      try {
        const { newEvent } = request.body
        const planKey = newEvent.planKey
        const machineId = newEvent.machineId
        const machineInfo = await getMachineInfo(machineId)
        if (!machineInfo) {
          return reply.code(400).send({ error: 'Machine not found' })
        }
        const programNoList = newEvent.program.split(',').map((pn: string) => Number.parseInt(pn, 10))
        if (programNoList.some(Number.isNaN)) {
          return reply.code(400).send({ error: 'Invalid program number format' })
        }

        const everyParamRequired = isTonello(machineInfo) || await isEveryStartParameterRequired(machineId)

        let planParameters: ValidatedPlanParameter[] = []
        if (everyParamRequired) {
          planParameters = await getEveryPlanParameter(planKey, machineId)
        } else {
          const parameters = await getRequiredStartingParametersForPrograms(programNoList, machineId)
          if (parameters.length === 0) {
            return reply.code(200).send('NO PARAMETER')
          }
          planParameters = await getStartingParametersWithValues(parameters, planKey)
        }

        if (planParameters.every(e => e.paramStatus === StartingParameters.Correct)) {
          await queueUnplannedEvent(newEvent)
          return reply.code(200).send('DONE')
        }
        return reply.code(200).send(planParameters)
      } catch (err) {
        fastify.log.error(`An error occurred while scheduling events: ${err}`)
        return reply.code(500).send({ error: `An error occurred while scheduling events: ${err}` })
      }
    },
  )
  done()
}
