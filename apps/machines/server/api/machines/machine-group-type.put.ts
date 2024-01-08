import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async (event) => {
  const { groupId, groupName, groupType } = await readBody(event)
  const res = await knex('BFMACHGROUP')
    .where('GROUPID', groupId)
    .update({
      GROUPTYPE: groupType,
    })
  return res
})
