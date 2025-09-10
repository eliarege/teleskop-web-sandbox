import { addSeconds } from 'date-fns'
import { sortBy } from 'lodash-es'
import { db } from '~/server/database'

interface PartialBatch {
  machineId: number
  programList: string
  startTime: Date
  endTime: Date | null
  cancelTime: Date | null
}

interface TheoreticalStep {
  stepNo: number
  programNo: number
  programIndex: number
  programStepNo: number
  commandNo: number
  theoreticDuration: number
}

interface ActualStep {
  actualStepNo: number
  programNo: number
  commandNo: number
  startTime: Date
  endTime: Date | null
}

interface ActualStepDetailed extends ActualStep {
  theoreticalStepNo: number
  stepStatus: 0 | 1 | 2
  isFinished: boolean
}

interface StepChange {
  changeDate: Date
  stepNo: number
  commandNo: number
  isInsert: boolean
}

// Actual adımlar üzerinden gidip varsayımda bulunuyor
// İlk başta stepChanges dizisini iterate ediyor.
// Eğer n. adım silinmişse, gerçekleşen adımlardan n. adım ve sonrasını 1 arttırıyor.
// Eğer n. adım eklenmişse, actual'daki n. adımın teoriğinden 0.001 çıkarıyor (?) (Selman abiye sor)
// Atlanılan adımlar, stepno'dan bakılarak mı anlaşılıyor sadece, müdahale yok mu?

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const batch = await db
    .from('BADATA')
    .first({
      machineId: 'MACHINEID',
      programList: 'PROGRAMNOLIST',
      // We are going to use `startTime` and `endTime` here for other queries, we should not apply timezone offset here
      startTime: 'STARTTIME',
      endTime: 'ENDTIME',
      cancelTime: 'CANCELTIME',
    }).where('BATCHKEY', batchKey) as PartialBatch | null

  if (!batch) {
    throw createError({
      statusCode: 404,
      message: 'BATCH_NOT_FOUND',
    })
  }

  const isActive = !(batch.endTime || batch.cancelTime)

  // Adım değişiklikleri yeniden eskiye sıralı olarak gelir.
  const stepChanges = await getBatchStepChanges(batchKey)
  const actualSteps = await getBatchActualSteps(batchKey) as ActualStepDetailed[]

  for (const step of actualSteps) {
    step.theoreticalStepNo = step.actualStepNo
    step.stepStatus = 0
    step.isFinished = true
  }

  const theoricSteps = isActive
    ? await getActiveBatchTheoreticalSteps(batch)
    : await getArchivedBatchTheoreticalSteps(batch)

  for (const change of stepChanges) {
    if (!change.isInsert) {
      for (const step of actualSteps) {
        if (step.theoreticalStepNo >= change.stepNo && step.startTime > change.changeDate) {
          step.theoreticalStepNo++
        }
      }
    } else {
      for (const step of actualSteps) {
        if (step.startTime > change.changeDate) {
          if (step.theoreticalStepNo === change.stepNo) {
            step.theoreticalStepNo -= 0.001
            step.stepStatus = 1
          } else if (step.theoreticalStepNo > change.stepNo) {
            step.theoreticalStepNo--
          }
        }
      }
    }
  }

  const skippedSteps: ActualStepDetailed[] = []

  for (let i = 1; i < actualSteps.length; i++) {
    const step = actualSteps[i]
    const lastStep = actualSteps[i - 1]

    // If there is skipped step in between
    if (step.theoreticalStepNo - lastStep.theoreticalStepNo > 1) {
      skippedSteps.push(...theoricSteps
        .filter(ts => ts.stepNo > lastStep.theoreticalStepNo && ts.stepNo < step.theoreticalStepNo)
        .map(ts => ({
          actualStepNo: -1,
          theoreticalStepNo: ts.stepNo,
          commandNo: ts.commandNo,
          programNo: ts.programNo,
          startTime: addSeconds(step.startTime, -1),
          endTime: null,
          stepStatus: 2,
          isFinished: false,
        } as ActualStepDetailed))
      )
    }
  }

  const maxActualStep = max(actualSteps, s => s.theoreticalStepNo) || 0
  const maxTheoricStep = max(theoricSteps, s => s.stepNo) || 0
  let pendingSteps: ActualStepDetailed[] = []

  if (maxTheoricStep > maxActualStep) {
    const maxStartTime = max(actualSteps, s => s.startTime) || new Date()
    pendingSteps = theoricSteps
      .filter(ts => ts.stepNo > maxActualStep)
      .map(ts => ({
        actualStepNo: -1,
          theoreticalStepNo: ts.stepNo,
          commandNo: ts.commandNo,
          programNo: ts.programNo,
          startTime: addSeconds(maxStartTime, 1),
          endTime: null,
          stepStatus: 2,
          isFinished: false,
      } as ActualStepDetailed))
  }

  const mergedSteps = sortBy([
    ...actualSteps,
    ...skippedSteps,
    ...pendingSteps,
  ], s => s.startTime)

  return mergedSteps
})

function max<T, V>(array: T[], cb: (value: T, index: number) => V): V | undefined {
  if (!array.length)
    return
  return array.reduce((max, item, index) => {
    const value = cb(item, index)
    return value > max ? value : max
  }, cb(array[0], 0))
}

async function getActiveBatchTheoreticalSteps(batch: PartialBatch): Promise<TheoreticalStep[]> {
  const programList = batch.programList.split(',').map(Number)
  if (!programList.length)
    return []

  return await db
    .from('BFMASTERSTEPS as S')
    .join(db.raw(/* sql */`(
    VALUES ${programList.map((p, i) => `(${p}, ${i})`)}
  ) T(PROGNO, PROGINDEX)`), 'S.PROGNO', 'T.PROGNO')
    .select({
      stepNo: db.raw('CAST(ROW_NUMBER() OVER (ORDER BY T.PROGINDEX, S.MAINSTEP) - 1 as INT)'),
      programNo: 'S.PROGNO',
      programIndex: 'T.PROGINDEX',
      programStepNo: 'S.MAINSTEP',
      commandNo: 'S.COMMANDNO',
      theoreticDuration: 'S.THEORETICDURATION',
    })
    .where('S.MACHINEID', batch.machineId)
    .andWhere('S.PARALELSTEP', '=', 0)
    .orderBy('stepNo')
}

async function getArchivedBatchTheoreticalSteps(batch: PartialBatch): Promise<TheoreticalStep[]> {
  const programList = batch.programList.split(',').map(Number)
  if (!programList.length)
    return []

  return await db
    .with('V', qb => qb
      .from('BAMASTERPRGHEADER as P')
      .join(db.raw(/* sql */`(
      VALUES ${programList.map((p, i) => `(${p}, ${i})`)}
    ) T(PROGNO, PROGINDEX)`), 'P.PROGNO', 'T.PROGNO')
      .select([
        'P.PROGNO',
        'P.MACHINEID',
        'P.MACHINEPRGVERSIONNO',
        'T.PROGINDEX',
      ])
      .where('P.MACHINEID', batch.machineId)
      .andWhere('P.RELEASEDATE', '<=', batch.startTime)
      .andWhere((qb) => {
        qb.whereNull('P.RELEASEENDDATE')
          .orWhere('P.RELEASEENDDATE', '>', batch.startTime)
      }))
    .from('BAMASTERSTEPS as S')
    .join('V', function () {
      this.on('S.MACHINEID', 'V.MACHINEID')
        .andOn('S.PROGNO', 'V.PROGNO')
        .andOn('S.MACHINEPRGVERSIONNO', 'V.MACHINEPRGVERSIONNO')
    })
    .select({
      stepNo: db.raw('CAST(ROW_NUMBER() OVER (ORDER BY V.PROGINDEX, S.MAINSTEP) - 1 AS INT)'),
      programNo: 'S.PROGNO',
      programIndex: 'V.PROGINDEX',
      programStepNo: 'S.MAINSTEP',
      commandNo: 'S.COMMANDNO',
      theoreticDuration: 'S.THEORETICDURATION',
    })
    .where('S.PARALELSTEP', '=', 0)
    .orderBy('stepNo')
}

/**
 * İş emrinde çalışmış ana adımlarını, çalışmaya başlama zamanlarına göre sıralı (artan) olarak döner.
 */
async function getBatchActualSteps(batchKey: number): Promise<ActualStep[]> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  return await db
    .from('BAACTUALPRGSTEPS')
    .select({
      actualStepNo: 'STEPNO',
      programNo: 'PRGNO',
      commandNo: 'COMMANDNO',
      startTime: db.raw(`DATEADD(MINUTE, ?, STARTTIME)`, teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, ENDTIME)`, teleskopTimezoneOffset),
    })
    .where('BATCHKEY', '=', batchKey)
    .andWhere('PARALLELSTEPNO', '=', 0)
    .orderBy('STARTTIME')
}

/**
 * İş emrindeki adım değişikliklerini, değişiklik tarihine göre sıralı (azalan) olarak döner.
 */
async function getBatchStepChanges(batchKey: number): Promise<StepChange[]> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  return await db
    .from('BASTEPCHANGES')
    .select({
      stepNo: 'MAINSTEP',
      commandNo: 'COMMANDNO',
      changeDate: db.raw(`DATEADD(MINUTE, ?, CHANGEDATE)`, teleskopTimezoneOffset),
      isInsert: 'STEPADDED',
    })
    .where('BATCHKEY', '=', batchKey)
    .andWhere('PARALELSTEP', '=', 0)
    .orderBy('CHANGEDATE', 'desc')
}
