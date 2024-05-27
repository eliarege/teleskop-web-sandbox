import { execa } from 'execa'

export default defineEventHandler(async (event) => {
  try {
    const { address } = await readBody(event)
    const { stdout } = await execa`ping -c 1 ${address}`
    return stdout
  }
  catch(e) {
    setResponseStatus(event, 404, 'Target Unreachable')
    event.node.res.end()
  }
})
