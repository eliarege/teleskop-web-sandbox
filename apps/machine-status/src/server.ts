import Fastify from 'fastify'
import cors from '@fastify/cors'
import machineStatus from './api/machine_status'
import { logger } from './logger'

export async function startServer({ host, port }: { host?: string, port: number }) {
  const fastify = Fastify({ logger })
  fastify.register(cors)
  fastify.register(machineStatus, { prefix: '/api/v1' })

  await fastify.listen({ host, port })
}
