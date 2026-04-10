import type { Knex } from 'knex'
import { dmExchangeKnex, isDmExchangeEnabled } from '~/server/connectionPool'

type MachineMirrorInput = {
  machineId: number
  machineCode: string
  groupId: number
  machineCapacity?: number | null
  theoricalCharge?: number | null
  inUse: boolean
}

const dmMachinesTable = 'dbo.Machines'

export async function upsertMachineToDmExchange(machine: MachineMirrorInput) {
  if (!dmExchangeKnex || !isDmExchangeEnabled)
    return

  if (!machine.inUse)
    return

  const machineNo = String(machine.machineId)
  const machineName = machine.machineCode
  const groupNo = machine.groupId
  const maxVolume = Number(machine.machineCapacity ?? 0)
  const maxWeight = Number(machine.theoricalCharge ?? 0)

  await dmExchangeKnex.transaction(async (dmTrx) => {
    const existingMachine = await dmTrx(dmMachinesTable)
      .first('MachineNo')
      .where({ MachineNo: machineNo })

    if (existingMachine) {
      await dmTrx(dmMachinesTable)
        .where({ MachineNo: machineNo })
        .update({
          MachineName: machineName,
          MGroupNo: groupNo,
          MaxVolume: maxVolume,
          MaxWeight: maxWeight,
          ImportState: 1,
        })
      return
    }

    await dmTrx(dmMachinesTable).insert({
      MachineNo: machineNo,
      MachineName: machineName,
      MGroupNo: groupNo,
      MinVolume: 0,
      MaxVolume: maxVolume,
      MinWeight: 0,
      MaxWeight: maxWeight,
      ImportState: 1,
    })
  })
}

export async function deleteMachinesFromDmExchange(machineIds: number[]) {
  if (!isDmExchangeEnabled || !dmExchangeKnex)
    return

  const machineNos = machineIds.map(id => String(id))
  await dmExchangeKnex(dmMachinesTable)
    .whereIn('MachineNo', machineNos)
    .update({ ImportState: 30 })
}

export async function syncMachinesWithDmExchange(knex: Knex) {
  if (!isDmExchangeEnabled || !dmExchangeKnex)
    return

  const activeMachines = await knex('BFMACHINES')
    .select({
      machineId: 'MACHINEID',
      machineName: 'MACHINECODE',
      groupNo: 'GRUPNO',
      maxVolume: 'MACHINECAPACITY',
      maxWeight: 'THEORICALCHARGE',
    })
    .where('GRUPNO', '!=', -1)
    .andWhere('INUSE', 1) as {
    machineId: number
    machineName: string
    groupNo: number
    maxVolume: number
    maxWeight: number
  }[]

  if (activeMachines.length === 0)
    return

  const machineNos = activeMachines.map(machine => String(machine.machineId))

  const existingMachines = await dmExchangeKnex(dmMachinesTable)
    .select({ machineNo: 'MachineNo' })
    .whereIn('MachineNo', machineNos)

  const existingMachineNos = new Set(existingMachines.map(machine => String(machine.machineNo)))

  const toInsert = activeMachines.filter(machine => !existingMachineNos.has(String(machine.machineId)))
  const toUpdate = activeMachines.filter(machine => existingMachineNos.has(String(machine.machineId)))

  if (toInsert.length > 0) {
    await dmExchangeKnex(dmMachinesTable).insert(
      toInsert.map(machine => ({
        MachineNo: String(machine.machineId),
        MachineName: machine.machineName,
        MGroupNo: machine.groupNo,
        MinVolume: 0,
        MaxVolume: machine.maxVolume,
        MinWeight: 0,
        MaxWeight: machine.maxWeight,
        ImportState: 1,
      })),
    )
  }

  for (const machine of toUpdate) {
    await dmExchangeKnex(dmMachinesTable)
      .where({ MachineNo: String(machine.machineId) })
      .update({
        MachineName: machine.machineName,
        MGroupNo: machine.groupNo,
        MaxVolume: machine.maxVolume,
        MaxWeight: machine.maxWeight,
        ImportState: 1,
      })
  }
}
