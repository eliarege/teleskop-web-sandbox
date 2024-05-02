import { v4 as uuid } from 'uuid'
import { useSSE } from '~/server/utils/sse'

export default defineEventHandler(async (event) => {
  try {
    const sse = useSSE()

    const client = {
      id: uuid(),
      event,
    }
    sse.addClient(client)

    sse.send(client.id, 'uuid', { uuid: client.id })
    sse.broadcast(client, 'connection', { message: 'Connected' })

    event.node.res.on('close', () => {
      sse.removeClient(client.id)
    })
    event._handled = true
  } catch (error) {
    console.error(error)
  }
})
