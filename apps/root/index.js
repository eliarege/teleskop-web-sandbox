import process from 'node:process'
import express from 'express'

const app = express()
const port = 4000
const urls = {
  machines: process.env.MACHINES_URL,
  multiMonitor: process.env.MULTIMONITOR_URL,
  dispensing: process.env.DISPENSING_MANAGER_UI_URL,
  reporting: process.env.REPORTING_URL,
  archive: process.env.ARCHIVE_URL,
  programEditor: process.env.PROGRAM_EDITOR_URL,
}

app.use(express.static('assets'))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('index', urls)
})

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`)
})

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
