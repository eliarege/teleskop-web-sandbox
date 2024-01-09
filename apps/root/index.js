import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import express from 'express'

const app = express()
const port = 4000
const __dirname = dirname(fileURLToPath(import.meta.url))

const urls = {
  machines: process.env.MACHINES_URL,
  multiMonitor: process.env.MULTIMONITOR_URL,
  dispensing: process.env.DISPENSING_MANAGER_UI_URL,
  reporting: process.env.REPORTING_URL,
  archive: process.env.ARCHIVE_URL,
  programEditor: process.env.PROGRAM_EDITOR_URL,
  planningBoard: process.env.PLANNING_BOARD_URL,
}

app.use(express.static(join(__dirname, 'assets')))

app.set('views', join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('index', urls)
})

const server = app.listen(port, () => {
  console.log(`Express server is running on port ${port}`)
})

process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())
