import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const commands = await tbb.fetchCommandGroups()
    const commandGroups = commands?.map(c => ({
      ...c,
      machineId,
    }))

    await knex('BFCOMMANDGROUP').del()
    await knex('BFCOMMANDGROUP').insert(commandGroups)

    return commandGroups
  } catch (err) {
    console.error(err)
  }
})
