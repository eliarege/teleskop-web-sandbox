import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new TbbFtpClient('192.168.88.202')

    const parameters = await tbb.fetchMachineParameters()
    const machineParameters = parameters?.map(p => ({
      ...p,
      machineId,
    }))
    await knex('BFMACHPARAMETERS').del()
    await knex('BFMACHPARAMETERS').insert(machineParameters)

    return machineParameters
  } catch (err) {
    console.error(err)
  }
})
