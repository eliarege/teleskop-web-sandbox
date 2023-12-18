import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { addBatchNote, deleteEvent, deleteNote, getBatchNotes, getPlannedEvents, getRecipe, getTheoreticalDuration, getUnplannedEvents, isTaskValid, removeFromPlan, scheduleEvents, updateEvents } from '../composables/query'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.get('/planning_board/scheduled_events', async (request: FastifyRequest<{
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
  fastify.get('/planning_board/recipe', async (request: FastifyRequest<{ Querystring: { machineId: string; jobOrder: string } }>, reply) => {
    try {
      const { jobOrder, machineId } = request.query
      const recipe = await getRecipe(machineId, jobOrder)
      return reply.code(200).send(recipe)
    } catch (err) {
      fastify.log.error(`Error fetching recipe: ${err.message}`)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.get('/planning_board/valid', async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
    try {
      const { planKey } = request.query
      const isValid = await isTaskValid(planKey)
      return reply.code(200).send(isValid)
    } catch (err) {
      fastify.log.error(`Error fetching recipe: ${err.message}`)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.get('/planning_board/theoretical_duration', async (request: FastifyRequest<{ Querystring: { planKey: number } }>, reply) => {
    try {
      const { planKey } = request.query
      return await getTheoreticalDuration(planKey)
    } catch (err) {
      fastify.log.error(`Error fetching recipe: ${err.message}`)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.get('/planning_board/batch_notes', async (request: FastifyRequest<{ Querystring: { jobOrder: string } }>, reply) => {
    try {
      const { jobOrder } = request.query
      return await getBatchNotes(jobOrder)
    } catch (err) {
      fastify.log.error(`Error fetching recipe: ${err.message}`)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.put<{
    Body: { planKey: number; machineId: number; plannedStartTime: string }
  }>('/planning_board/scheduled_events/update', async (request, reply) => {
    try {
      const { planKey, machineId, plannedStartTime } = request.body
      await updateEvents(planKey, machineId, plannedStartTime)
      return reply.code(200).send('Succesful!')
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.put<{ Querystring: { planKey: number } }>('/planning_board/unplan', async (request, reply) => {
    try {
      const { planKey } = request.query
      await removeFromPlan(planKey)
      return reply.code(200).send('Succesful!')
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.put<{ Querystring: { planKey: number } }>('/planning_board/delete', async (request, reply) => {
    try {
      const { planKey } = request.query
      await deleteEvent(planKey)
      return reply.code(200).send('Succesful!')
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.post<{
    Body: { jobOrder: string; note: string; showOnScreen: boolean; userId: number }
  }>('/planning_board/batch_notes/add_note', async (request, reply) => {
    try {
      const { jobOrder, note, userId, showOnScreen } = request.body
      await addBatchNote(jobOrder, note, userId, showOnScreen)
      return reply.code(200).send('Succesful!')
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
      await scheduleEvents(planKey, machineId, plannedStartTime)
      return reply.code(200).send('Succesful!')
    } catch (err) {
      console.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  fastify.delete<{
    Querystring: { id: number }
  }>('/planning_board/batch_notes/delete_note', async (request: FastifyRequest<{ Querystring: { id: number } }>, reply) => {
    try {
      const { id } = request.query
      await deleteNote(id)
      return reply.code(200).send('Succesful!')
    } catch (err) {
      console.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  done()
}
