import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const { groupId, groupName, groupType } = await readBody(event)
    const res = await knex('BFMACHGROUP')
      .where('GROUPID', groupId)
      .update({
        GROUPTYPE: groupType,
      })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
