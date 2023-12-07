import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { getPlannedEvents, getUnplannedEvents } from '../composables/query'
import { knex } from '../knexConfig'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get('/planning_board/scheduled_events', async (request: FastifyRequest<{
    Querystring: { from: string; to: string }
  }>, reply) => {
    try {
      const { from, to } = request.query
      if (!from || !to) {
        return reply.code(400).send({ error: 'Both "from" and "to" parameters are required.' })
      }
      const plannedEvents = (await getPlannedEvents(from, to))
      return reply.code(200).send(plannedEvents)
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.get('/planning_board/unscheduled_events', async (request: FastifyRequest<{
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
  })
  fastify.put<{
    Body: { planKey: number; machineId: number; plannedStartTime: string }
  }>('/planning_board/scheduled_events/update', async (request, reply) => {
    try {
      const { planKey, machineId, plannedStartTime } = request.body
      await knex('PTBATCHPLANQUEUE')
        .update({ MACHINEID: machineId })
        .where({ PLANKEY: planKey })

      await knex('DYBFBATCHPLAN')
        .update({
          MACHINEIDLIST: machineId,
          PLANNEDMACHINE: machineId,
          PLANNEDSTARTTIME: plannedStartTime,
        })
        .where({ PLANKEY: planKey })
      return reply.code(200).send('Succesfull!')
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.post<{
    Body: { planKey: number; machineId: number; plannedStartTime: string }
  }>('/planning_board/unscheduled_events/schedule', async (request, reply) => {
    try {
      const { planKey, machineId, plannedStartTime } = request.body
      const queueNumber = (await knex.raw(`SELECT TOP 1 p.QUEUENUMBER + 1 as queue FROM PTBATCHPLANQUEUE p WHERE p.MACHINEID = ${machineId} ORDER BY p.QUEUENUMBER DESC`))[0].queue
      console.log(queueNumber)
      await knex('DYBFBATCHPLAN')
        .update({
          MACHINEIDLIST: machineId,
          PLANNEDMACHINE: machineId,
          PLANNEDSTARTTIME: plannedStartTime,
        })
        .where({ PLANKEY: planKey })

      await knex('PTBATCHPLANQUEUE')
        .insert({
          PLANKEY: planKey,
          MACHINEID: machineId,
          QUEUENUMBER: queueNumber,
          STARTTIME: plannedStartTime,
        })

      return reply.code(200).send('Succesfull!')
    } catch (err) {
      console.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  done()
}
