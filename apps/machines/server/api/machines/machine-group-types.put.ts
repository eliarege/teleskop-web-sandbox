import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { changedGroups } = await readBody(event)

  for (const group of changedGroups) {
    const { groupId, groupName, groupType } = group

    await knex('BFMACHGROUP')
      .where('GROUPID', groupId)
      .update({
        GROUPTYPE: groupType,
      })
  }
})
