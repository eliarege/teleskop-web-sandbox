import { subMinutes } from 'date-fns'
import { LRUCache } from 'lru-cache'
import { isDef } from '@teleskop/utils'
import { BinaryFileType, IOType } from '../utils/constants'
import { archiveCache, ArchivedIoValuesWithStartTime } from '../archiveCache'
import { db } from '~/server/database'
import type {
  AnalogInputOutputType,
  AnalogValue,
  ArchivedAnalogValue,
  ArchivedCalculatedValue,
  ArchivedDigitalValue,
  ArchivedIoValues,
  ArchivedReelCycleTime,
  ArchivedVirtualInputValue,
  CalculatedValue,
  Counter,
  DigitalInputOutputType,
  DigitalValue,
  Reel,
  VirtualInput,
} from '~/types/archive'
import type { DuoAny, DuoParsed, DuoRaw } from '~/types/utils'
import { insertAnalogInputValues, insertAnalogOutputValues, insertCalculatedValues, insertCounterValues, insertDigitalInputValues, insertDigitalOutputLockValues, insertDigitalOutputValues, insertReelCycleTimes, insertVirtualInputValues } from '~/shared/io'
import { calculatedValueKeys } from '~/shared/constants'
import { gunzip } from 'zlib'
import { promisify } from 'util'
import { getMachineModelByBatchKey } from './machine'

const pGunzip = promisify(gunzip)

interface BatchValueOptions {
  isActive?: boolean | null
  since?: Date | null
}
/**
 * Herhangi iş emrinin IO değerlerini döner. IO değerleri kendi içlerinde oluşturuldukları tarihlere göre artan sıradadır.
 * Eğer aktif bir eş emriyse bilgileri veri tabanından alır, arşivlenmiş bir iş emriyse arşiv sunucusundan alır.
 * Eğer iş emrinin aktif veya pasif olduğu bilgisi, fonksiyonu çağıran tarafta varsa, fonksiyona ikinci parametre olarak bu bilgi verilebilir.
 */
export async function getBatchIoValues(batchKey: number, options = {} as BatchValueOptions): Promise<DuoAny<ArchivedIoValues>> {
  let isActive = options.isActive
  if (!isDef(options.isActive)) {
    isActive = await isBatchActive(batchKey)
    if (!isDef(isActive)) {
      throw createError({
        statusCode: 404,
        message: 'BATCH_NOT_FOUND',
      })
    }
  }
  return isActive
    ? await getActiveBatchIoValues(batchKey, options.since)
    : await getArchivedBatchIoValues(batchKey, options.since)
}

/** Arşivlenen bir iş emrinin IO değerlerini, arşiv sunucusundan alır. */
export async function getArchivedBatchIoValues(batchKey: number, since?: Date | null): Promise<DuoRaw<ArchivedIoValues>> {
  const model = await getMachineModelByBatchKey(batchKey)

  const values = model === 'Tonello'
    ? await getArchivedBatchIoValuesFromBatchFiles(batchKey)
    : await archiveCache.fetch(batchKey)

  if (values && since && new Date(values.startTime) < since) {
    const avLastIndex = values.analogValues.findLastIndex(v => new Date(v.logtime) < since)
    const dvLastIndex = values.digitalValues.findLastIndex(v => new Date(v.logtime) < since)
    const vivLastIndex = values.virtualInputValues.findLastIndex(v => new Date(v.logtime) < since)
    const ctLastIndex = values.cycleTimes.findLastIndex(v => new Date(v.cycleDate) < since)
    const cvLastIndex = values.calculatedValues.findLastIndex(v => new Date(v.logtime) < since)
    return {
      analogValues: values.analogValues.slice(avLastIndex + 1),
      digitalValues: values.digitalValues.slice(dvLastIndex + 1),
      virtualInputValues: values.virtualInputValues.slice(vivLastIndex + 1),
      cycleTimes: values.cycleTimes.slice(ctLastIndex + 1),
      calculatedValues: values.calculatedValues.slice(cvLastIndex + 1),
    }
  } else {
    return values
      // Edge case, see: https://github.com/isaacs/node-lru-cache/issues/302
      || {
        analogValues: [],
        digitalValues: [],
        virtualInputValues: [],
        cycleTimes: [],
        calculatedValues: [],
      }
  }
}

/** Aktif olan iş emrinin IO ve tur süreleri verilerini döner */
export async function getActiveBatchIoValues(batchKey: number, since?: Date | null): Promise<DuoParsed<ArchivedIoValues>> {
  return {
    analogValues: await getActiveAnalogIoValues(batchKey, { since }),
    digitalValues: await getActiveDigitalIoValues(batchKey, since),
    cycleTimes: await getActiveReelCycleTimes(batchKey, since),
    virtualInputValues: await getActiveVirtualInputValues(batchKey, since),
    calculatedValues: await getActiveCalculatedValues(batchKey, since),
  }
}

/**
 * İş emrinin çalıştığı makinenin analog input tanımlarını döner.
 */
export async function getAnalogInputs(batchKey: number, analogValues?: DuoAny<ArchivedAnalogValue>[]): Promise<DuoAny<AnalogInputOutputType[]>> {
  const analogInputs = await db
    .from('BFMACHAIN as M')
    .select({
      ioIndex: 'M.ID',
      name: 'M.NAME',
      enabled: 'M.ENABLED',
      calibType: 'M.CALIBTYPE',
      calibMaxValue: 'M.CALIBMAXVALUE',
      calibUnit: 'M.CALIBUNIT',
    })
    .where('M.ISDELETED', 0)
    .join('BADATA as D', function () {
      this.on('D.BATCHKEY', db.raw(batchKey))
        .andOn('D.MACHINEID', '=', 'M.MACHINEID')
    })
    .orderBy('M.ID') as DuoAny<AnalogInputOutputType>[]

  for (const ai of analogInputs) {
    ai.ioValues = []
  }

  if (analogValues) {
    insertAnalogInputValues(analogInputs, analogValues)
  }

  return analogInputs
}

/**
 * İş emrinin çalıştığı makinenin analog output tanımlarını döner.
 */
export async function getAnalogOutputs(batchKey: number, analogValues?: DuoAny<ArchivedAnalogValue>[]): Promise<DuoAny<AnalogInputOutputType[]>> {
  const analogOutputs = await db
    .from('BFMACHAOUT as M')
    .select({
      ioIndex: 'M.ID',
      name: 'M.NAME',
      enabled: 'M.ENABLED',
    })
    .where('M.ISDELETED', 0)
    .join('BADATA as D', function () {
      this.on('D.BATCHKEY', db.raw(batchKey))
        .andOn('D.MACHINEID', '=', 'M.MACHINEID')
    })
    .orderBy('M.ID') as DuoAny<AnalogInputOutputType>[]

  for (const ao of analogOutputs) {
    ao.ioValues = []
  }

  if (analogValues) {
    insertAnalogOutputValues(analogOutputs, analogValues)
  }

  return analogOutputs
}

/**
 * İş emrinin çalıştığı makinenin sayaç tanımlarını döner.
 */
export async function getCounters(batchKey: number, analogValues?: DuoAny<ArchivedAnalogValue>[]): Promise<DuoAny<Counter[]>> {
  const counters = await db
    .from('BFMACHCOUNTER as M')
    .select({
      ioIndex: 'M.ID',
      name: 'M.NAME',
      enabled: 'M.ENABLED',
      calibUnit: 'M.CALIBUNIT',
    })
    .where('M.ISDELETED', 0)
    .join('BADATA as D', function () {
      this.on('D.BATCHKEY', db.raw(batchKey))
        .andOn('D.MACHINEID', '=', 'M.MACHINEID')
    })
    .orderBy('M.ID') as DuoAny<Counter>[]

  for (const cnt of counters) {
    cnt.ioValues = []
  }

  if (analogValues) {
    insertCounterValues(counters, analogValues)
  }

  return counters
}

/**
 * İş emrinin çalıştığı makinenin sanal input tanımlarını döner.
 */
export async function getVirtualInputs(batchKey: number, virtualInputValues?: DuoAny<ArchivedVirtualInputValue>[]): Promise<DuoAny<VirtualInput[]>> {
  const virtualInputs = await db
    .from('BFMACHVIN as M')
    .select({
      ioIndex: 'M.ID',
      name: 'M.NAME',
      enabled: 'M.ENABLED',
      buttonType: 'M.BUTTONTYPE',
    })
    .where('M.ISDELETED', 0)
    .join('BADATA as D', function () {
      this.on('D.BATCHKEY', db.raw(batchKey))
        .andOn('D.MACHINEID', '=', 'M.MACHINEID')
    })
    .orderBy('M.ID') as DuoAny<VirtualInput>[]

  for (const vi of virtualInputs) {
    vi.ioValues = []
  }

  if (virtualInputValues) {
    insertVirtualInputValues(virtualInputs, virtualInputValues)
  }

  return virtualInputs
}

/**
 * İş emrinin çalıştığı makinenin dijital input tanımlarını döner.
 */
export async function getDigitalInputs(batchKey: number, digitalValues?: DuoAny<ArchivedDigitalValue>[]): Promise<DuoAny<DigitalInputOutputType[]>> {
  const digitalInputs = await db
    .select({ name: 'di.NAME', ioIndex: 'di.ID' })
    .from('BFMACHDIN as di')
    .join('BADATA as b', function () {
      this.on('b.BATCHKEY', db.raw(batchKey))
        .andOn('di.MACHINEID', 'b.MACHINEID')
    })
    .where('ISDELETED', 0)
    .orderBy('di.ID') as DuoAny<DigitalInputOutputType[]>

  for (const di of digitalInputs) {
    di.ioValues = []
  }

  if (digitalValues) {
    insertDigitalInputValues(digitalInputs, digitalValues)
  }

  return digitalInputs
}

/**
 * İş emrinin çalıştığı makinenin dijital output tanımlarını döner.
 */
export async function getDigitalOutputs(batchKey: number, digitalValues?: DuoAny<ArchivedDigitalValue>[]): Promise<DuoAny<DigitalInputOutputType[]>> {
  const digitalOutputs = await db
    .select({ name: 'do.NAME', ioIndex: 'do.ID' })
    .from('BFMACHDOUT as do')
    .join('BADATA as b', function () {
      this.on('b.BATCHKEY', db.raw(batchKey))
        .andOn('do.MACHINEID', 'b.MACHINEID')
    })
    .where('ISDELETED', 0)
    .orderBy('do.ID') as DuoAny<DigitalInputOutputType[]>

  for (const dout of digitalOutputs) {
    dout.ioValues = []
  }

  if (digitalValues) {
    insertDigitalOutputValues(digitalOutputs, digitalValues)
  }

  return digitalOutputs
}

/**
 * İş emrinin çalıştığı makinenin dijital output kilit tanımlarını döner.
 */
export async function getDigitalOutputLocks(batchKey: number, digitalValues?: DuoAny<ArchivedDigitalValue>[]): Promise<DuoAny<DigitalInputOutputType[]>> {
  const digitalOutputLocks = await db
    .select({ name: 'do.NAME', ioIndex: 'do.ID' })
    .from('BFMACHDOUT as do')
    .join('BADATA as b', function () {
      this.on('b.BATCHKEY', db.raw(batchKey))
        .andOn('do.MACHINEID', 'b.MACHINEID')
    })
    .where('ISDELETED', 0)
    .orderBy('do.ID') as DuoAny<DigitalInputOutputType[]>

  for (const dout of digitalOutputLocks) {
    dout.ioValues = []
  }

  if (digitalValues) {
    insertDigitalOutputLockValues(digitalOutputLocks, digitalValues)
  }

  return digitalOutputLocks
}

/**
 * İş emrinin çalıştığı makinenin kule tanımlarını döner.
 */
export async function getReels(batchKey: number, cycleTimes?: DuoAny<ArchivedReelCycleTime>[]): Promise<DuoAny<Reel[]>> {
  const machine = await db
    .from('BADATA as B')
    .join('BFMACHINES as M', 'B.MACHINEID', 'M.MACHINEID')
    .where('B.BATCHKEY', batchKey)
    .first({ reelCount: 'REELCOUNT' }) as { reelCount: number } | undefined

  if (!machine) {
    throw createError({
      statusCode: 404,
      message: 'BATCH_NOT_FOUND',
    })
  }

  const reels = Array.from({ length: machine.reelCount }, (_, i) => ({
    reelNo: i,
    cycles: [],
  } as DuoAny<Reel>))

  if (cycleTimes) {
    insertReelCycleTimes(reels, cycleTimes)
  }

  return reels
}

export function getCalculatedValues(calculatedValues: DuoAny<ArchivedCalculatedValue>[]): DuoAny<CalculatedValue>[] {
  const cvs = Array.from({ length: calculatedValueKeys.length }, (_, i) => ({
    ioIndex: i,
    name: calculatedValueKeys[i],
    ioValues: [],
  } as DuoAny<CalculatedValue>))
  if (calculatedValues) {
    insertCalculatedValues(cvs, calculatedValues)
  }
  return cvs
}

export async function isBatchActive(batchKey: number): Promise<boolean | null> {
  const batch = await db
    .from('BADATA')
    .first({
      endTime: 'ENDTIME',
      cancelTime: 'CANCELTIME',
    })
    .where('BATCHKEY', batchKey) as {
      endTime: Date | null
      cancelTime: Date | null
    } | null | undefined

  if (!batch) {
    return null
  } else {
    return !batch.cancelTime && !batch.endTime
  }
}

export interface AnalogOptions {
  type?: 1 | 2 | 5
  since?: Date | null
}

/**
 * Veri tabanından ilgili batch'deki analog değerlerini, oluşturuldukları zamana göre artan sırada döner. Eğer batch arşivlenmişse, bu fonksiyon yüksek ihtimalle boş array döner.
 * Arşivlenmiş iş emirlerinin analog verilerini almak için {@link getArchivedBatchIoValues} fonksiyonunu kullanınız.
 */
export async function getActiveAnalogIoValues(batchKey: number, options: AnalogOptions = {}): Promise<DuoParsed<ArchivedAnalogValue[]>> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  const query = db
    .from('BAIOVALUES_CURRENT')
    .where('BATCHKEY', '=', batchKey)
    .select({
      logtime: db.raw('DATEADD(MINUTE, ?, LOGTIME)', teleskopTimezoneOffset),
      ioIndex: 'IOINDEX',
      ioType: 'IOTYPE',
      ioValue: 'IOVALUE',
    })
    .orderBy('LOGTIME')

  if (options.since) {
    query.andWhere('LOGTIME', '>', subMinutes(options.since, teleskopTimezoneOffset))
  }
  if (options.type) {
    query.andWhere('IOTYPE', '=', options.type)
  }

  return await query
}

/**
 * Veri tabanından ilgili batch'deki dijital değerleri, oluşturuldukları zamana göre artan sırada döner. Eğer batch arşivlenmişse, bu fonksiyon yüksek ihtimalle boş array döner.
 * Arşivlenmiş iş emirlerinin dijital verilerini almak için {@link getArchivedBatchIoValues} fonksiyonunu kullanınız.
 */
export async function getActiveDigitalIoValues(batchKey: number, since?: Date | null): Promise<DuoParsed<ArchivedDigitalValue[]>> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  const query = db
    .from('BADIOVALUES_CURRENT')
    .select({
      logtime: db.raw('DATEADD(MINUTE, ?, LOGTIME)', teleskopTimezoneOffset),
      DI: 'DIValues',
      DOF: 'DOFuncValues',
      DOL: 'DOLockValues',
    })
    .where('BATCHKEY', batchKey)
    .orderBy('LOGTIME')

  if (since) {
    query.andWhere('LOGTIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }
  return await query
}

/**
 * Veri tabanından ilgili batch'deki sanal input değerlerini, oluşturuldukları zamana göre artan sırada döner. Eğer batch arşivlenmişse, bu fonksiyon yüksek ihtimalle boş array döner.
 * Arşivlenmiş iş emirlerinin sanal input değerlerini almak için {@link getArchivedBatchIoValues} fonksiyonunu kullanınız.
 */
export async function getActiveVirtualInputValues(batchKey: number, since?: Date | null): Promise<DuoParsed<ArchivedVirtualInputValue[]>> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  const query = db
    .from('BAVINVALUES_CURRENT')
    .select({
      logtime: db.raw('DATEADD(MINUTE, ?, LOGTIME)', teleskopTimezoneOffset),
      ioId: 'VIID',
      ioValue: 'VALUE',
    })
    .where('BATCHKEY', batchKey)
    .orderBy('LOGTIME')

  if (since) {
    query.andWhere('LOGTIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }
  return await query
}

/**
 * Veri tabanından ilgili batch'deki kule tur sürelerini, kaydedildikleri zamana göre artan sırada döner. Eğer batch arşivlenmişse, bu fonksiyon yüksek ihtimalle boş array döner.
 * Arşivlenmiş iş emirlerinin kule tur sürelerini almak için {@link getArchivedBatchIoValues} fonksiyonunu kullanınız.
 */
export async function getActiveReelCycleTimes(batchKey: number, since?: Date | null): Promise<DuoParsed<ArchivedReelCycleTime[]>> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  const query = db
    .from('BACYCLETIMES_CURRENT')
    .select({
      reelNo: 'REELNO',
      cycleCount: 'CYCLECOUNT',
      cycleTime: 'CYCLETIME',
      cycleDate: db.raw('DATEADD(MINUTE, ?, CYCLEDATETIME)', teleskopTimezoneOffset),
    })
    .where('BATCHKEY', batchKey)
    .orderBy(['REELNO', 'CYCLEDATETIME'])

  if (since) {
    query.andWhere('CYCLEDATETIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }
  return await query
}

export async function getActiveCalculatedValues(batchKey: number, since?: Date | null): Promise<DuoParsed<ArchivedCalculatedValue[]>> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  const query = db
    .from('BACALCULATEDVALUES')
    .select({
      progNo: 'PROGNO',
      valueId: 'VALUEID',
      value: 'VALUE',
      logtime: db.raw('DATEADD(MINUTE, ?, LOGTIME)', teleskopTimezoneOffset),
    })
    .where('BATCHKEY', batchKey)
    .orderBy('LOGTIME')

  if (since) {
    query.andWhere('LOGTIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }

  return await query
}
/**
 * Şimdilik sadece Tonello makineleri için geçerli olan bir fonksiyon.
 * BADATA_FILES tablosuna iletişim sürücüsünün NodeJS sürümü yazar.
 * Bu sürüm ise mevcut durumda (0.76.x) sadece Tonello makinelerinde kullanılır.
 */
export async function getArchivedBatchIoValuesFromBatchFiles(batchKey: number): Promise<DuoRaw<ArchivedIoValuesWithStartTime>> {
  const config = useRuntimeConfig()
  const batchStartTimeResult = await db
    .from('BADATA')
    .first({ 
      startTime: db.raw('DATEADD(MINUTE, ?, STARTTIME)', config.teleskopTimezoneOffset)
    })
    .where('BATCHKEY', batchKey) as { startTime: Date } | null | undefined

  if (!batchStartTimeResult) {
    throw createError({
      statusCode: 404,
      message: 'BATCH_NOT_FOUND',
    })
  }

  const batchFiles = await db
    .from('BADATA_FILES')
    .select({
      fileType: 'FILETYPE',
      fileContent: 'FILECONTENT',
    })
    .where('BATCHKEY', batchKey)
    .whereIn('FILETYPE', [BinaryFileType.AnalogIO_JSON, BinaryFileType.DigitalIO_JSON])

  const analogValuesZip = batchFiles.find(f => f.fileType === BinaryFileType.AnalogIO_JSON)?.fileContent
  const digitalValuesZip = batchFiles.find(f => f.fileType === BinaryFileType.DigitalIO_JSON)?.fileContent
    
  let analogValues: DuoRaw<ArchivedAnalogValue>[] = []
  let digitalValues: DuoRaw<ArchivedDigitalValue>[] = []

  if (analogValuesZip) {
    const analogValuesBuffer = await pGunzip(analogValuesZip)
    analogValues = JSON.parse(analogValuesBuffer.toString('utf-8'))
  }
  if (digitalValuesZip) {
    const digitalValuesBuffer = await pGunzip(digitalValuesZip)
    digitalValues = JSON.parse(digitalValuesBuffer.toString('utf-8'))
  }

  return {
    startTime: batchStartTimeResult.startTime.toISOString(),
    analogValues,
    digitalValues,
    virtualInputValues: [],
    cycleTimes: [],
    calculatedValues: [],
  }
}