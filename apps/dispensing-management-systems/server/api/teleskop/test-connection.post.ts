import Knex from 'knex'

export default defineEventHandler(async (event) => {
  const { connection } = await readBody(event)
  const teleskopDB = Knex({
    client: connection.client,
    connection: {
      user: connection.user,
      password: connection.password,
      host: connection.host,
      port: connection.port,
      database: connection.database,
    },
  })
  await teleskopDB.raw('select 1+1 as result').then(() => setResponseStatus(event, 200, 'OK'))
    .catch((err: any) => setResponseStatus(event, 400, err.toString()))
  return event.node.res.end()
})
