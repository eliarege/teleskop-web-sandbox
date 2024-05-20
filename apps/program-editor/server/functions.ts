import type { Knex } from 'knex'
import type { Machine, MachineGroup, MachineInfo, ParameterItem, Program, ioListItem } from '../shared/types'
import { PError } from './error'
import { db } from './database'

interface TransactionOptions {
  trx?: Knex.Transaction
}

/**
 * Verilen machineId'ye sahip makinenin veritabanında olup olmadığını kontrol eder
 * @param machineId - Makine Id
 * @returns {Promise<MachineInfo>} - Makine
 */
export async function hasMachine(machineId: number): Promise<MachineInfo> {
  const machine = await db('BFMACHINES').where('MACHINEID', machineId).first('MACHINEID')

  if (!machine)
    throw new PError('MACHINE_NOT_FOUND', { machineId })

  return machine
}

/**
 * Belirtilen makinenin id numarasına göre makinenin IP adresini alır
 * @param machineId - Makinenin id numarası
 * @returns {Promise<string>} - Makinenin IP adresi
 * @throws {PError} Makine IP adresi bulunamazsa error döner.
 */
export async function getMachineHost(machineId: number): Promise<string> {
  const host = (await db('BFMACHINES').where('MACHINEID', machineId).first('IP')).IP

  if (!host)
    throw new PError('MACHINE_IP_NOT_FOUND', { machineId })

  return host
}

export interface InsertProgramOptions extends TransactionOptions {
  force?: boolean
}

/**
 * Makine gruplarının listesini getirir
 * @returns {Promise<MachineGroup[]>} Makine grup dizisi içeren bir Promise
 */
export async function getMachineGroup(): Promise<MachineGroup[]> {
  const machineGroups: MachineGroup[] = await db
    .select(
      'GROUPID as groupId',
      'GROUPNAME as name',
      'GROUPTYPE as type',
      'MMVisible as visible', // ?
    )
    .from('BFMACHGROUP')
  return machineGroups
}

/**
 * Kullanımda olan ve teleskop kullanımına izin verilen tüm makinelerin listesini getirir
 * @returns {Promise<MachineInfo[]>} Makine dizisi içeren bir Promise
 */
export async function getMachines(): Promise<MachineInfo[]> {
  const machines: MachineInfo[] = await db('BFMACHINES')
    .select('MACHINEID AS id', 'MACHINECODE AS name', 'GRUPNO AS groupId')
    .where('INUSE', 1)
    .andWhere('USEINTELESKOP', 1)

  return machines
}

export async function getMachinesAsList(): Promise<{ name: string, value: number, label: string }[]> {
  const machines: { name: string, value: number, label: string }[] = await db('BFMACHINES')
    .select('MACHINEID AS value', 'MACHINECODE AS name', 'GRUPNO AS groupId')
    .where('INUSE', 1)
    .andWhere('USEINTELESKOP', 1)
  return machines.map(machine => ({
    name: machine.name,
    value: machine.value,
    label: `${machine.value}. ${machine.name}`,
  }))
}

/**
 * Kullanımda olan ve teleskop kullanımına izin verilen tüm makinelerin listesini getirir
 * @returns {Promise<MachineGroup[]>} Makine grup dizisi içeren bir Promise
 */
export async function groupMachinesByGroup(): Promise<MachineGroup[]> {
  const machines: MachineInfo[] = await getMachines()
  const groups: MachineGroup[] = await getMachineGroup()

  return groups.map(group => ({
    ...group,
    machines: machines.filter(machine => machine.groupId === group.groupId),
  }))
}

/**
 * Return all process types
 * @returns {Promise<{label: string, value: number}[]>}
 */
export async function fetchProcessTypes(): Promise<{ label: string, value: number }[]> {
  return await db
    .select({
      value: 'PROCESSCODE',
      label: 'PROCESSNAME',
    })
    .from('BFPROCESSTYPES')
}

export async function getMachineBatchParameters(machineId: number): Promise<any[]> {
  const parameters = await db('BFMACHBATCHPARAMETERS')
    .where('MACHINEID', machineId)
    .select({
      name: 'PARAMSTRING',
      id: 'BATCHPARAMETERID',
      min: 'PARAMLOWLIMIT',
      max: 'PARAMHIGHLIMIT',
      value: 'DEFAULTVALUE',
    })
  return parameters
}
