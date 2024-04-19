import process from 'node:process'
import { Mutex } from 'async-mutex'
import Fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import pino from 'pino'
import * as planningBoard from './api/scheduler/routes'
import * as queueBased from './api/scheduler/queue-based/routes'
import * as timeBased from './api/scheduler/time-based/routes'
import { generateClientId } from './composables/helper'
import { getAllTasks } from './composables/socket'
import { knex } from './knexConfig'
import { createPtColumnsTable } from './composables/table'

const logger = pino()
const app = Fastify({ logger })
const port = Number.parseInt(process.env.SERVER_PORT || '3500')
app.register(fastifyIO, {
  cors: {
    allowedHeaders: '*',
  },
})
function registerRoutes(fastify: typeof app): void {
  fastify.register(planningBoard.routes)
  fastify.register(queueBased.routes)
  fastify.register(timeBased.routes)
}
registerRoutes(app)

app.get('/', (req, reply) => {})

const mutex = new Mutex()
const clientTasks: Record<string, string[]> = {}
const DB_NAME = process.env.TELESKOP_DATABASE
app.ready().then(async () => {
  await knex.raw(`ALTER DATABASE ${DB_NAME} SET COMPATIBILITY_LEVEL = 130`)

  await createPtColumnsTable(knex)

  app.io.on('connection', async (socket) => {
    console.log('User connected!')

    const clientId = generateClientId()
    clientTasks[clientId] = []

    socket.on('onDragStart', async (task: string) => {
      const taskId = task
      clientTasks[clientId].push(taskId)
      socket.emit('onDragStartResponse', getAllTasks(clientTasks))
    })

    socket.on('onDrop', async () => {
      clientTasks[clientId].pop()
      // await taskValidation()
      socket.emit('dropResponse', getAllTasks(clientTasks))
    })
  })
})

app.listen({ port, host: '0.0.0.0' })
