// HTTP Mock API that returns events from a predefined array, for testing purposes.
import { createServer } from 'node:http'
import events from './fixtures/events.json' with { type: 'json' }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const server = createServer((req, res) => {
  // Get query parameters
  const url = new URL(req.url, `http://localhost`)
  if (url.pathname === '/api/v1/getEvents' && req.method === 'GET') {
    const date = url.searchParams.get('date')
    const from = url.searchParams.get('from')
    if (!date || !from || !DATE_RE.test(date)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing or invalid date or from parameters' }))
      return
    }
    const firstEvent = getFirstEventIndex(date, Number.parseInt(from))
    const result = firstEvent === -1 ? [] : events.eventsList.events.slice(firstEvent)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      eventsList: {
        events: result,
      },
    }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

function extractDate(datetime) {
  return datetime.split('T')[0]
}

function getFirstEventIndex(date, from) {
  return events.eventsList.events.findIndex(event =>
    (extractDate(event.datetime) === date && event.id >= from)
    || extractDate(event.datetime) > date,
  )
}

server.listen(1234, () => {
  console.log('Mock API server is running on http://localhost:1234')
})
