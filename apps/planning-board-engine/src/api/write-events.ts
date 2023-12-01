import type { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify'

export const routes: FastifyPluginCallback<object> = (fastify, opt, done) => {
  fastify.post('/execute', async (request, reply) => {
    try {
      // TODO: Write events to PTREVISION table from other tables
    } catch (err) {
      console.error(err)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
  done()
}
