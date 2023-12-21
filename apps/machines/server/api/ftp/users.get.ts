import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const tbb = new FTPClient('192.168.88.202')

    const users = await tbb.fetchUsers()

    await knex('BFUSERS').del()
    await knex('BFUSERS').insert(users)

    return users
  } catch (err) {
    console.error(err)
  }
})
