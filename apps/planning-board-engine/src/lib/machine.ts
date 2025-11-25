import type { Knex } from 'knex'
import { knex } from '~/knexConfig'

export interface MachineInfo {
  machineId: number
  name: string
  host: string
  tbbModel: string
}

export async function getMachineInfo(machineId: number, options?: { trx: Knex }): Promise<MachineInfo | null> {
  const machineInfo = await (options?.trx || knex)
    .from('BFMACHINES')
    .select({
      machineId: 'MACHINEID',
      name: 'MACHINECODE',
      host: 'IP',
      tbbModel: 'TBBMODEL',
    })
    .where('MACHINEID', machineId)
    .first()

  return machineInfo || null
}

/**
 * Checks if a machine is a Tonello machine
 * @param machineInfo Machine information object
 * @returns true if the machine is a Tonello model
 */
export function isTonello(machineInfo: MachineInfo): boolean {
  return machineInfo.tbbModel === 'Tonello'
}
