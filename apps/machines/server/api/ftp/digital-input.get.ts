import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const inputs = await tbb.fetchDigitalInputs()
    const digitalInputs = inputs?.map(i => ({
      ...i,
      machineId,
    }))

    await knex('BFMACHDIN').del()
    await knex('BFMACHDIN').insert(digitalInputs)

    return digitalInputs
  } catch (err) {
    console.error(err)
  }
})
