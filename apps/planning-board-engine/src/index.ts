import process from 'node:process'
import Fastify from 'fastify'

const app = Fastify({ logger: true })
const port = Number.parseInt(process.env.SERVER_PORT || '3500')

app.listen({ port })
