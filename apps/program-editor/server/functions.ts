import type { Knex } from 'knex'
import type { CommandParameter, MachineGroup, MachineInfo, MachineTbbModel, MachineUnusableReason, ProcessType, TeleskopSettings, TreatmentGroup } from '../shared/types'
import { PError } from './error'
import { db, dmExchange } from './database'
import { TeleskopSettingsIds } from '~/shared/constants'

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
export async function fetchMachineDetails(machineId: number): Promise<{ host: string, tbbModel: MachineTbbModel, version: string }> {
  const response = await db
    .from('BFMACHINES')
    .where('MACHINEID', machineId)
    .first({
      host: 'IP',
      tbbModel: 'TBBMODEL',
      version: 'VERSION',
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
    .select({
      id: 'MACHINEID',
      name: 'MACHINECODE',
      groupId: 'GRUPNO',
    })
    .where('INUSE', 1)
    .andWhere('USEINTELESKOP', 1)

  return machines
}

/**
 * Makine disable (devre dışı) durumunu kontrol eder
 * Komutu olmayan makineler disable kabul edilir
 */
export async function getMachineDisableStatus(
  machineIds: number[],
):
  Promise<Record<number, { disabled: boolean, reason?: MachineUnusableReason }>> {
  if (!machineIds.length)
    return {}

  const rows = await db('BFMASTERCOMMANDS')
    .distinct('MACHINEID')
    .whereIn('MACHINEID', machineIds)
    .where({ ACTIVATED: 1, ISDELETED: 0 })

  const enabledIds = new Set(rows.map(r => r.MACHINEID))

  return Object.fromEntries(
    machineIds.map(id => [
      id,
      enabledIds.has(id)
        ? { disabled: false }
        : { disabled: true, reason: 'NO_COMMANDS' },
    ]),
  )
}

/**
 * Kullanımda olan ve teleskop kullanımına izin verilen tüm makinelerin listesini getirir
 * @returns {Promise<MachineGroup[]>} Makine grup dizisi içeren bir Promise
 */
export async function groupMachinesByGroup(): Promise<MachineGroup[]> {
  const machines: MachineInfo[] = await getMachines()
  const groups: MachineGroup[] = await getMachineGroup()

  const machineIds = machines.map(m => m.id)
  const disabledMachines = await getMachineDisableStatus(machineIds)

  return groups.map(group => ({
    ...group,
    machines: machines
      .filter(machine => machine.groupId === group.groupId)
      .map((machine) => {
        const status = disabledMachines[machine.id]

        return {
          ...machine,
          disabled: status?.disabled ?? false,
          usability: status?.reason,
        }
      }),
  }))
}

export async function fetchProcessTypes(): Promise<ProcessType[]> {
  return await db
    .select({
      value: 'PROCESSCODE',
      label: 'PROCESSNAME',
      description: 'NOTE',
    })
    .from('BFPROCESSTYPES')
    .where('BOYAPRGMI', 1)
}

export async function createProcessType(body: { processType: ProcessType }): Promise<boolean> {
  const processType = body.processType

  const result = await db('BFPROCESSTYPES')
    .insert({
      PROCESSCODE: processType.value,
      PROCESSNAME: processType.label.trim(),
      NOTE: processType.description?.trim() || '',
      BOYAPRGMI: 1,
    })

  return result.length > 0
}

export async function updateProcessType(body: { processType: ProcessType, originalProcessCode?: number }): Promise<boolean> {
  const processType = body.processType
  const originalProcessCode = body.originalProcessCode
  const whereClause = originalProcessCode || processType.value

  const result = await db('BFPROCESSTYPES')
    .update({
      PROCESSCODE: processType.value,
      PROCESSNAME: processType.label.trim(),
      NOTE: processType.description?.trim() || '',
    })
    .where('PROCESSCODE', whereClause)

  return result > 0
}

export async function deleteProcessType(body: { processCode?: number, PROCESSCODE?: number }): Promise<boolean> {
  const processCode = body.processCode || body.PROCESSCODE
  const result = await db
    .del()
    .where('PROCESSCODE', processCode)
    .from('BFPROCESSTYPES')

  return result > 0
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

  const getValue = (id: TeleskopSettingsIds) =>
    settings.find(s => s.id === id)?.value

  // Program yazarken optimize edilsin
  const optimizedEnable = getValue(TeleskopSettingsIds.OPTIMIZED_ENABLE) === '1'

  // Optimize edilebilen parametre sayısı (yoksa 10 alınacak)
  const optimizedLimit = Number(getValue(TeleskopSettingsIds.OPTIMIZED_LIMIT) ?? 10)

  // Programda gösterilecek ikonlar
  const selectedIcons = Number(getValue(TeleskopSettingsIds.SELECTED_ICONS) ?? 0)

  // Başlangıç sıcaklığı
  const initialTemperature = Number(getValue(TeleskopSettingsIds.INITIAL_TEMPERATURE) ?? 25)

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
