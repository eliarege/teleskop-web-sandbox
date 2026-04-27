import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)

    // #region Machine Select
    const machineSelectParams = {
      machineId: 'MACHINEID',
      machineCode: 'MACHINECODE',
      groupId: 'GRUPNO',
      groupName: 'GROUPNAME',
      tbbModel: 'TBBMODEL',
      plcModel: 'PlcModel',
      ip: 'IP',
      theoreticalCharge: 'THEORICALCHARGE',
      theoreticalChargeDuration: 'theoricalChargeDuration',
      machineCapacity: 'MACHINECAPACITY',
      reelCount: 'REELCOUNT',
      nozzleCount: 'NOZZLECOUNT',
      steamUnit: 'STEAMUNIT',
      steamKgPerHour: 'STEAMKGPERHOUR',
      additionalTank1: 'ADDITIONALTANK1',
      additionalTank2: 'ADDITIONALTANK2',
      additionalTank3: 'ADDITIONALTANK3',
      additionalTank4: 'ADDITIONALTANK4',
      reserveTank: 'RESERVETANK',
      storeElectricityAsInc: 'STOREELECTRICITYASINC',
      theoreticalWater: 'theoricWater',
      inUse: 'INUSE',
      MTTempIo: 'MTTEMPIO',
      version: 'VERSION',
      productModel: 'PRODUCTMODEL',
      hardwareModel: 'HARDWAREMODEL',
      steamValveDo: 'STEAMVALVEDO',
      theoreticalSteam: 'theoricSteam',
    }

    const machineQuery = knex('BFMACHINES')
      .select(machineSelectParams)
      .leftJoin('BFMACHGROUP', 'BFMACHINES.GRUPNO', 'BFMACHGROUP.GROUPID')
      .where('GRUPNO', '!=', -1)
      .orderBy('MACHINEID')

    if (filters)
      filtersToKnex(filters, machineSelectParams, machineQuery)
    // #endregion

    // #region Bulk fetch
    const [machines, mainTanks, steamValveDos] = await Promise.all([
      machineQuery,
      knex('BFMACHAIN').select({
        machineId: 'MACHINEID',
        id: 'ID',
        name: 'NAME',
      }),
      knex('BFMACHDOUT').select({
        machineId: 'MACHINEID',
        ioId: 'ID',
        ioName: 'NAME',
      }),
    ])
    // #endregion

    // #region Group by machineId
    const tanksByMachine = mainTanks.reduce((acc, t) => {
      if (!acc[t.machineId])
        acc[t.machineId] = []
      acc[t.machineId].push({
        id: t.id,
        name: t.name,
      })
      return acc
    }, {} as Record<number, { id: number, name: string }[]>)

    const valvesByMachine = steamValveDos.reduce((acc, v) => {
      if (!acc[v.machineId])
        acc[v.machineId] = []
      acc[v.machineId].push({
        ioId: v.ioId,
        ioName: v.ioName,
      })
      return acc
    }, {} as Record<number, { ioId: number, ioName: string }[]>)
    // #endregion

    // #region Merge
    const result = machines.map(m => ({
      ...m,
      MTOptions: tanksByMachine[m.machineId] || [],
      steamValveOptions: valvesByMachine[m.machineId] || [],
    }))
    // #endregion

    return result
  } catch (err) {
    console.error('Error fetching machines:', err)
    throw createError({ statusCode: 500, message: 'Failed to fetch machines' })
  }
})
