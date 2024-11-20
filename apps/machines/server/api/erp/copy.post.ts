import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId, mode } = await readBody(event)

  await knex.transaction(async (trx) => {
    if (mode === 1) {
      await trx('BFERPPARAMETERDEFINITIONS')
        .where({
          MACHINEID: targetMachineId,
        })
        .del()

      const source = await trx('BFERPPARAMETERDEFINITIONS')
        .where({
          MACHINEID: sourceMachineId,
        })

      await trx('BFERPPARAMETERDEFINITIONS')
        .insert(source.map(row => ({
          ...row,
          MACHINEID: targetMachineId,
        })),
        )
    } else if (mode === 2) {
      await trx('BFERPPARAMETERDEFINITIONS')
        .where({
          MACHINEID: targetMachineId,
        })
        .whereIn('PARAMNAME', trx('BFMACHBATCHPARAMETERS')
          .select('PARAMSTRING')
          .where({
            MACHINEID: targetMachineId,
          }))
        .del()

      const source = await trx('BFERPPARAMETERDEFINITIONS')
        .where({
          MACHINEID: sourceMachineId,
        })
        .whereIn('PARAMNAME', trx('BFMACHBATCHPARAMETERS')
          .select('PARAMSTRING')
          .where({
            MACHINEID: sourceMachineId,
          }))

      await trx('BFERPPARAMETERDEFINITIONS')
        .insert(source.map(row => ({
          ...row,
          MACHINEID: targetMachineId,
        })),
        )
    } else if (mode === 3) {
      await trx('BFERPPARAMETERDEFINITIONS')
        .where({
          MACHINEID: targetMachineId,
        })
        .whereNotIn('PARAMNAME', trx('BFMACHBATCHPARAMETERS')
          .select('PARAMSTRING')
          .where({
            MACHINEID: targetMachineId,
          }))
        .del()

      const source = await trx('BFERPPARAMETERDEFINITIONS')
        .where({
          MACHINEID: sourceMachineId,
        })
        .whereNotIn('PARAMNAME', trx('BFMACHBATCHPARAMETERS')
          .select('PARAMSTRING')
          .where({
            MACHINEID: sourceMachineId,
          }))

      await trx('BFERPPARAMETERDEFINITIONS')
        .insert(source.map(row => ({
          ...row,
          MACHINEID: targetMachineId,
        })),
        )
    }
  })
})
