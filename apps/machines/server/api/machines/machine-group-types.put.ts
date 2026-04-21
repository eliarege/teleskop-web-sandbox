import { dmExchangeKnex, knex } from '~/server/connectionPool'
import { upsertMachineGroupToDmExchange } from '~/server/lib/dmexchange'

export default defineAuthEventHandler(async (event) => {
  const { changedGroups } = await readBody(event)

  for (const group of changedGroups) {
    const { groupId, groupName, groupType } = group

    await knex('BFMACHGROUP')
      .where('GROUPID', groupId)
      .update({
        GROUPTYPE: groupType,
      })

    if (dmExchangeKnex)
      await upsertMachineGroupToDmExchange(dmExchangeKnex, { groupId, groupName })
  }
})
