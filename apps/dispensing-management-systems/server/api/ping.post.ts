import { execa } from 'execa'

export default defineEventHandler(async (event) => {
  const { address } = await readBody(event)
  const { stdout } = await execa`ping -c 1 ${address}`;
  return stdout
})
