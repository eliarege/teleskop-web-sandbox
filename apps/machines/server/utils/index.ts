import { knex } from '~/server/connectionPool'

export async function getIOName(machineId, type, id) {
  let tableName
  switch (type) {
    case 0:
      tableName = 'BFMACHAIN'
      break
    case 1:
      tableName = 'BFMACHAOUT'
      break
    case 2:
      tableName = 'BFMACHDIN'
      break
    case 3:
      tableName = 'BFMACHDOUT'
      break
    case 4:
      tableName = 'BFMACHCOUNTER'
      break

    default:
      break
  }

  return await knex(tableName).where({
    MACHINEID: machineId,
    ID: id,
  }).select('NAME')
}
