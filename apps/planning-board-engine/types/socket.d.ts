import type { Server } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<{
      hello: () => string
      hi: (data: string) => void
      clientMessage: (data: object) => void
      serverResponse: (data: string) => void
    }>
  }
}
