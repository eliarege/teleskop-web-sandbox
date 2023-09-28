import { knex } from '~/server/connectionPool'

interface Dual {
  id: number
  value: number
}

export default defineEventHandler(async (event): Promise<number> => {
  try {
    const response: Array<Dual> = await knex('TFTELESKOPSETTINGS')
      .select('ID as id', 'VALUE as value')
      .where('ID', 2)

    return response[0].value
  } catch (error) {
    console.error('Error executing query', error)
    throw error
  }
})
