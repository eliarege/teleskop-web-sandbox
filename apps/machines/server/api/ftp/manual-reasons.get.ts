import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const tbb = new FTPClient('192.168.88.202')

    const manualReasons = await tbb.fetchManualReasons()

    await knex('BFMANUALREASONSGENERAL').del()
    await knex('BFMANUALREASONSGENERAL').insert(manualReasons)

    return manualReasons
  } catch (err) {
    console.error(err)
  }
})
