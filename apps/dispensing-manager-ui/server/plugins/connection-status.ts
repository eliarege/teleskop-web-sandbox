// plugins/test.ts
import { execa } from 'execa'
import { withBase } from 'ufo'
import { knex } from '~/server/connectionPool'

const config = useRuntimeConfig()

export default defineNitroPlugin((nitroApp) => {
  let status = [] as any[]
  async function fetchData() {
    status = await getDispenserConnectionStatus()
    setTimeout(fetchData, 10000)
  }
  fetchData()

  nitroApp.h3App.stack.unshift({
    route: withBase(`/api/dispenser-connection-status`, config.app.baseURL),
    handler: defineEventHandler(() => {
      return status
    }),
  })
})

async function getDispenserConnectionStatus() {
  const dispensers = await knex('DYTFDISPENSERSETTINGS')
    .select({
      dispNo: 'DISPENSERID',
      fileSystem: 'BDYREQUESTPATH',
      dispIP: 'IP',
    })
  const statusPromises = dispensers.map(async (dispenser) => {
    try {
      await execa('ping', ['-c', '1', '-W', '1', dispenser.dispIP])
      return ({
        ...dispenser,
        status: true,
      })
    } catch {
      return ({
        ...dispenser,
        status: false,
      })
    }
  })
  return await Promise.all(statusPromises)
}
