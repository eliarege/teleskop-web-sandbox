import { Mutex } from 'async-mutex'
import Fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { fastifyAdapter } from '@teleskop/keycloak-adapter/fastify'
import * as planningBoard from './api/scheduler/routes'
import * as queueBased from './api/scheduler/queue-based/routes'
import * as timeBased from './api/scheduler/time-based/routes'
import { generateClientId } from './composables/helper'
import { getAllTasks } from './composables/socket'
import { knex } from './knexConfig'
import { logger } from './composables/logger'
import { config } from './config'
import { autoPlan } from './composables/autoPlan'

const app = Fastify({ logger })
const KC_ACCESS_ROLE = 'access'

app.register(fastifyIO, {
  cors: {
    allowedHeaders: '*',
  },
})

if (config.keycloakEnabled) {
  app.register(fastifyAdapter, {
    url: config.keycloakUrl,
    realm: config.keycloakRealm,
    clientId: config.keycloakClientId,
    accessRole: KC_ACCESS_ROLE,
    global: true,
  })
}

function registerRoutes(fastify: typeof app): void {
  fastify.register(planningBoard.routes)
  fastify.register(queueBased.routes)
  fastify.register(timeBased.routes)
}
registerRoutes(app)

app.get('/', (req, reply) => {})

const mutex = new Mutex()

const clientTasks: Record<string, string[]> = {}

app.ready().then(async () => {
  async function scheduleAutoPlan() {
    try {
      await autoPlan(knex)
    } catch (err) {
      logger.error(err, 'Error in scheduled autoPlan')
    } finally {
      setTimeout(scheduleAutoPlan, 15 * 60 * 1000)
    }
  }
  scheduleAutoPlan()

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

app.listen({
  port: config.serverPort,
  host: config.serverHost,
})
