import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  await knex.transaction(async (trx) => {
    const source = await trx('BFERPPARAMETERDEFINITIONS')
      .where({
        MACHINEID: sourceMachineId,
      })

    await trx('BFERPPARAMETERDEFINITIONS')
      .where({
        MACHINEID: targetMachineId,
      })
      .del()

    await trx('BFERPPARAMETERDEFINITIONS')
      .insert(source.map(row => ({
        ...row,
        MACHINEID: targetMachineId,
      })),
      )
  })
})
