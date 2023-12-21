import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const tbb = new FTPClient('192.168.88.202')

    const finishReasons = await tbb.fetchFinishReasons()

    await knex('BFDYLOTFINISHREASONS').del()
    await knex('BFDYLOTFINISHREASONS').insert(finishReasons)

    return finishReasons
  } catch (err) {
    console.error(err)
  }
})
