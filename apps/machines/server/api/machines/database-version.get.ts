import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const versions = await knex.raw('SELECT @@VERSION AS version')
  const version = versions[0].version.split('\n')[0].split(' - ')[1].split(' ')[0]
  return version
})
