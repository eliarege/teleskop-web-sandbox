import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const app = express()
const port = 3001

app.use(express.static('assets'))

app.get('/', (req, res) => {
  res.sendFile(path.join(dirname(fileURLToPath(import.meta.url)), 'index.html'))
})

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`)
})
