import type { Server } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<{
      hello: () => string
      hi: (data: string) => void // Specify the type of the payload here
      clientMessage: (data: string) => void
      serverResponse: (data: string) => void
    }>
  }
}
