import process from 'node:process'
import { Mutex } from 'async-mutex'
import Fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import pino from 'pino'
import * as planningBoard from './api/planning-board'
import * as writeEvents from './api/write-events'
import { generateClientId } from './composables/helper'
import { getAllTasks } from './composables/socket'

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
  fastify.register(writeEvents.routes)
}
registerRoutes(app)

app.get('/', (req, reply) => {})

const mutex = new Mutex()
const clientTasks: Record<string, string[]> = {}

app.ready().then(() => {
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
