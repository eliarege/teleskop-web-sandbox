import process from 'node:process'
import Fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import pino from 'pino'

const logger = pino()
const app = Fastify({ logger })
const port = Number.parseInt(process.env.SERVER_PORT || '3500')

app.register(fastifyIO, {
  cors: {
    allowedHeaders: '*',
  },
})

app.get('/', (req, reply) => {})

app.ready().then(() => {
  app.io.on('connection', async (socket) => {
    socket.on('clientMessage', (data) => {
      console.log('socket:', socket.id)
      console.log('Received message from client:', data)

      socket.emit('serverResponse', 'Hello from the server!')
    })
  })
})

app.listen({ port })
