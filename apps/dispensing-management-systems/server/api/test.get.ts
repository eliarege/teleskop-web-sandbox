import { teleskopDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const dbs = await teleskopDB('sys.Databases').select('Name')
    console.log(dbs)
    return dbs
  } catch (e) {
    console.log(e)
    return e
  }
})
