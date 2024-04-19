import { setHeaders, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'

interface Client {
  id: string
  event: H3Event
}

let clients: Client[] = []

export function useSSE() {
  const addClient = ({ id, event }: Client) => {
    setHeaders(event, {
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'content-type': 'text/event-stream',
    } as any)
    setResponseStatus(event, 200)
    clients.push({ id, event })
  }

  const removeClient = (id: string) => {
    const current = clients.find(c => c.id === id)
    if (current) {
      current.event.node.res.end()
    }

    clients = clients.filter(c => c.id !== id)
  }

  const broadcast = (client: Client, eventName: string, data: Record<string, any>) => {
    client.event.node.res.write(`event: ${eventName}\n`)
    client.event.node.res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  const broadcasts = (eventName: string, data: Record<string, any>) => {
    clients.forEach(client => broadcast(client, eventName, data))
  }

  return { clients, addClient, removeClient, broadcast, broadcasts }
}
