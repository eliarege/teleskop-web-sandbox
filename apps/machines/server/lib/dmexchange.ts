import type { Knex } from 'knex'

type MachineMirrorInput = {
  machineId: number
  machineCode: string
  groupId: number
  machineCapacity?: number | null
  theoricalCharge?: number | null
  inUse: boolean
}

type MachineGroupMirrorInput = {
  groupId: number
  groupName: string
}

const dmMachinesTable = 'dbo.Machines'
const dmMachineGroupsTable = 'dbo.Machine_Groups'

export async function upsertMachineToDmExchange(dmKnex: Knex, machine: MachineMirrorInput) {
  if (!machine.inUse)
    return

  const machineNo = String(machine.machineId)
  const machineName = machine.machineCode
  const groupNo = machine.groupId
  const maxVolume = Number(machine.machineCapacity ?? 0)
  const maxWeight = Number(machine.theoricalCharge ?? 0)

  await dmKnex.transaction(async (dmTrx) => {
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

export async function deleteMachinesFromDmExchange(dmKnex: Knex, machineIds: number[]) {
  const machineNos = machineIds.map(id => String(id))
  await dmKnex(dmMachinesTable)
    .whereIn('MachineNo', machineNos)
    .update({ ImportState: 30 })
}

export async function syncMachinesWithDmExchange(sourceKnex: Knex, dmKnex: Knex) {
  const activeMachines = await sourceKnex('BFMACHINES')
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

  await dmKnex.transaction(async (dmTrx) => {
    const existingMachines = await dmTrx(dmMachinesTable)
      .select({ machineNo: 'MachineNo' })
      .whereIn('MachineNo', machineNos)

    const existingMachineNos = new Set(existingMachines.map(machine => String(machine.machineNo)))

    const toInsert = activeMachines.filter(machine => !existingMachineNos.has(String(machine.machineId)))
    const toUpdate = activeMachines.filter(machine => existingMachineNos.has(String(machine.machineId)))

    if (toInsert.length > 0) {
      await dmTrx(dmMachinesTable).insert(
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
      await dmTrx(dmMachinesTable)
        .where({ MachineNo: String(machine.machineId) })
        .update({
          MachineName: machine.machineName,
          MGroupNo: machine.groupNo,
          MaxVolume: machine.maxVolume,
          MaxWeight: machine.maxWeight,
          ImportState: 1,
        })
    }
  })
}

export async function upsertMachineGroupToDmExchange(dmKnex: Knex, group: MachineGroupMirrorInput) {
  await dmKnex.transaction(async (dmTrx) => {
    const existingGroup = await dmTrx(dmMachineGroupsTable)
      .first('MGroupNo')
      .where({ MGroupNo: group.groupId })

    if (existingGroup) {
      await dmTrx(dmMachineGroupsTable)
        .where({ MGroupNo: group.groupId })
        .update({
          MGroupName: group.groupName,
          ImportState: 1,
        })
      return
    }

    await dmTrx(dmMachineGroupsTable).insert({
      MGroupNo: group.groupId,
      MGroupName: group.groupName,
      ImportState: 1,
    })
  })
}

export async function deleteMachineGroupsFromDmExchange(dmKnex: Knex, groupIds: number[]) {
  await dmKnex(dmMachineGroupsTable)
    .whereIn('MGroupNo', groupIds)
    .update({ ImportState: 30 })
}

export async function syncMachineGroupsWithDmExchange(sourceKnex: Knex, dmKnex: Knex) {
  const activeGroups = await sourceKnex('BFMACHGROUP')
    .select({
      groupId: 'GROUPID',
      groupName: 'GROUPNAME',
    }) as { groupId: number, groupName: string }[]

  if (activeGroups.length === 0)
    return

  const groupIds = activeGroups.map(g => g.groupId)

  await dmKnex.transaction(async (dmTrx) => {
    const existingGroups = await dmTrx(dmMachineGroupsTable)
      .select({ groupNo: 'MGroupNo' })
      .whereIn('MGroupNo', groupIds)

    const existingGroupNos = new Set(existingGroups.map(g => Number(g.groupNo)))

    const toInsert = activeGroups.filter(g => !existingGroupNos.has(g.groupId))
    const toUpdate = activeGroups.filter(g => existingGroupNos.has(g.groupId))

    if (toInsert.length > 0) {
      await dmTrx(dmMachineGroupsTable).insert(
        toInsert.map(g => ({
          MGroupNo: g.groupId,
          MGroupName: g.groupName,
          ImportState: 1,
        })),
      )
    }

    for (const group of toUpdate) {
      await dmTrx(dmMachineGroupsTable)
        .where({ MGroupNo: group.groupId })
        .update({
          MGroupName: group.groupName,
          ImportState: 1,
        })
    }
  })
}
