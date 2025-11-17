import type { Knex } from 'knex'

export interface MachineInfo {
  machineId: number
  name: string
  host: string
  tbbModel: string
}

export async function fetchMachineInfo(db: Knex, machineId: number): Promise<MachineInfo | null> {
  const machineInfo = await db
    .from('BFMACHINES')
    .select({
      machineId: 'MACHINEID',
      name: 'MACHINECODE',
      host: 'IP',
      tbbModel: 'TBBMODEL',
    })
    .where('MACHINEID', machineId)
    .first()

  return machineInfo
}
