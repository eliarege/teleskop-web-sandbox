import type { Knex } from 'knex'
import type { CommandParameter, MachineGroup, MachineInfo, MachineTbbModel, ProcessType, TeleskopSettings, TreatmentGroup } from '../shared/types'
import { PError } from './error'
import { db, dmExchange } from './database'
import { MSSQL_ERROR } from './constants'

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
export async function fetchMachineDetails(machineId: number): Promise<{ host: string, tbbModel: MachineTbbModel }> {
  const response = await db
    .from('BFMACHINES')
    .where('MACHINEID', machineId)
    .first({
      host: 'IP',
      tbbModel: 'TBBMODEL',
    })

  if (!response)
    throw new PError('MACHINE_NOT_FOUND', { machineId })

  return response
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
    .select({
      groupId: 'GROUPID',
      name: 'GROUPNAME',
      type: 'GROUPTYPE',
      visible: 'MMVisible', // ?
    })
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

export async function fetchProcessTypes(): Promise<ProcessType[]> {
  try {
    return await db
      .select({
        value: 'PROCESSCODE',
        label: 'PROCESSNAME',
        description: 'NOTE',
      })
      .from('BFPROCESSTYPES')
  } catch (e: any) {
    throw createError({ statusCode: 500, data: { messageCode: 'PROCESS_TYPE_FETCH_FAILED', error: e.message } })
  }
}

export async function createProcessType(body: { type: ProcessType }): Promise<boolean> {
  try {
    const type = body.type
    const result = await db('BFPROCESSTYPES')
      .insert({
        PROCESSCODE: type.value,
        PROCESSNAME: type.label.trim(),
        NOTE: type.description?.trim() || '',
        BOYAPRGMI: 1,
      })

    return result.length > 0
  } catch (e: any) {
    if (e.number === MSSQL_ERROR.DUPLICATE_PK)
      throw createError({ statusCode: 400, data: { messageCode: 'PROCESS_TYPE_EXISTS', key: body.type.value } })
    throw e
  }
}

export async function updateProcessType(body: { type: ProcessType }): Promise<boolean> {
  try {
    const type = body.type
    const result = await db('BFPROCESSTYPES')
      .update({
        PROCESSNAME: type.label.trim(),
        NOTE: type.description?.trim() || '',
      })
      .where('PROCESSCODE', type.value)

    return result > 0
  } catch (e: any) {
    if (e.number === MSSQL_ERROR.DUPLICATE_PK)
      throw createError({ statusCode: 400, data: { messageCode: 'PROCESS_TYPE_EXISTS', key: body.type.value } })
    throw e
  }
}

export async function deleteProcessType(body: { processCode?: number, PROCESSCODE?: number }): Promise<boolean> {
  try {
    const processCode = body.processCode || body.PROCESSCODE
    const result = await db
      .del()
      .where('PROCESSCODE', processCode)
      .from('BFPROCESSTYPES')

    return result > 0
  } catch (e: any) {
    if (e.number === MSSQL_ERROR.DUPLICATE_PK)
      throw createError({ statusCode: 400, data: { messageCode: 'PROCESS_TYPE_EXISTS', key: body.processCode || body.PROCESSCODE } })
    throw e
  }
}

export async function getMachineBatchParameters(machineId: number): Promise<CommandParameter[]> {
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

/**
 *
 * @param activityCode { 1 | 2 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 }
 * @param exp1 Mostly 'Makine ' + machineId, on Program Paste 'Kaynak Makine/Program machineId/programNo
 * @param exp2 Mostly 'Program ' + programNo, on Program Paste 'Hedef Makine/Program machineId/programNo
 */
export async function logEditorOperation(activityCode: number, exp1: string, exp2: string | number) {
  await db('TFTeleskopUserActivities').insert({
    actUserId: 1,
    actAppId: 3, // 3 is the value of ProgramEditor
    actEventCode: activityCode,
    actExplanation1: exp1,
    actExplanation2: exp2,
  })
}

export async function getTreatmentParams(): Promise<any[]> {
  const treatmentParams = await db('BFTREATMENTPARAMGROUPMAP')
    .select({
      commandNo: 'COMMANDNO',
      parameterIndex: 'PARAMETERINDEX',
    })
  return treatmentParams
}

export async function getGroupIdByMachineId(machineId: number): Promise<number | undefined> {
  const groups = await groupMachinesByGroup()
  for (const group of groups) {
    for (const machine of group.machines) {
      if (machine.id === machineId) {
        return group.groupId
      }
    }
  }
  return undefined
}

export async function ensureTreatmentGroups(): Promise<TreatmentGroup[]> {
  const config = useRuntimeConfig()
  if (!config.dmexchangeEnabled)
    return []

  const treatmentGroups = await dmExchange('Treatment_Groups')
    .select({
      TreatmentGroupNo: 'TreatmentGroupNo',
      TreatmentGroupName: 'TreatmentGroupName',
      ImportState: 'ImportState',
    })

  const hasGeneralGroup = treatmentGroups.find(treatmentGroup => treatmentGroup.TreatmentGroupNo === 1)
  if (!hasGeneralGroup) {
    await dmExchange('Treatment_Groups').insert({
      TreatmentGroupNo: 1,
      TreatmentGroupName: 'General Program Group',
      ImportState: 1,
    })
  }

  return treatmentGroups
}

export async function fetchTeleskopSettings(): Promise<TeleskopSettings> {
  const settings = await db('TFTELESKOPSETTINGS').select({ id: 'ID', value: 'VALUE' })

  // Program yazarken optimize edilsin
  const optimizedEnable = settings.find(s => s.id === 3)?.value === '1'

  // Optimize edilebilen parametre sayısı (yoksa 10 alınacak)
  const optimizedLimit = Number(settings.find(s => s.id === 11)?.value ?? 10)

  // Programda gösterilecek ikonlar
  const selectedIcons = Number(settings.find(s => s.id === 12)?.value ?? 0)

  // Başlangıç sıcaklığı
  const initialTemperature = Number(settings.find(s => s.id === 13)?.value ?? 25)

  return {
    treatmentSettings: {
      optimizedEnable,
      optimizedLimit,
    },
    selectedIcons,
    initialTemperature,
  }
}

/**
 * Updates Teleskop Settings
 * @param id - Settings ID
 * @param value - Settings Value
 */
export async function updateTeleskopSettings(id: number, value: string): Promise<void> {
  const hasSetting = await db('TFTELESKOPSETTINGS').where('ID', id).first()

  if (!hasSetting) {
    await db('TFTELESKOPSETTINGS')
      .insert({ ID: id, VALUE: value })
  } else {
    await db('TFTELESKOPSETTINGS')
      .update({ value })
      .where('ID', id)
  }
}

export async function getTeleskopSettings(): Promise<TeleskopSettings> {
  const settings = await db('TFTELESKOPSETTINGS').select({ id: 'ID', value: 'VALUE' })

  // Program yazarken optimize edilsin
  const optimizedEnable = settings.find(s => s.id === 3)?.value === '1'

  // Optimize edilebilen parametre sayısı (yoksa 10 alınacak)
  const optimizedLimit = Number(settings.find(s => s.id === 11)?.value ?? 10)

  // Programda gösterilecek ikonlar
  const selectedIcons = Number(settings.find(s => s.id === 12)?.value ?? 0)

  // Başlangıç sıcaklığı
  const initialTemperature = Number(settings.find(s => s.id === 13)?.value ?? 25)

  return {
    treatmentSettings: {
      optimizedEnable,
      optimizedLimit,
    },
    selectedIcons,
    initialTemperature,
  }
}
