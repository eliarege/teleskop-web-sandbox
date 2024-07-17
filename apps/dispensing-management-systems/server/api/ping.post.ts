import { execa } from 'execa'
import { ipformat } from '~/utils/utils'

export default defineEventHandler(async (event) => {
  try {
    const { address } = await readBody(event)
    if (!ipformat.test(address)) {
      setResponseStatus(event, 400, 'Invalid IP address')
      event.node.res.end()
    }
    const { stdout } = await execa`ping -c 1 ${address}`
    return stdout
  }
  catch(e) {
    setResponseStatus(event, 404, 'Target Unreachable')
    event.node.res.end()
  }
})
