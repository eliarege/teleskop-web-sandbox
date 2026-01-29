import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  // AlarmNo 6000 or 5000
  const jobOrderStopAlarms = await db('BAALARM')
    .select({
      programNo: 'PROGNO',
      startTime: 'STARTTIME',
      endTime: 'ENDTIME',
    })
    .where('BATCHKEY', batchKey)
    .andWhere('ALARMNO', 6000)
    .orderBy('STARTTIME')

  const manualModeAlarms = await db('BAALARM')
    .select({
      startTime: 'STARTTIME',
      endTime: 'ENDTIME',
    })
    .where('BATCHKEY', batchKey)
    .andWhere('ALARMNO', 5000)
    .orderBy('STARTTIME')

  // const totalManualDelayDurations: Array<{ programNo: number, totalDuration: number }> = []
  const programManualData: Array<{ programNo: number, intersection: number, duration: number }> = []
  if (!jobOrderStopAlarms.length) {
    if (manualModeAlarms.length) {
      for (const manualAlarm of manualModeAlarms) {
        manualAlarm.startTime = new Date(manualAlarm.startTime)
        manualAlarm.endTime = new Date(manualAlarm.endTime)
        const prgIndex = programManualData.findIndex(p => p.programNo === manualAlarm.programNo)
        if (prgIndex !== -1) {
          programManualData[prgIndex].duration += (manualAlarm.endTime.getTime() - manualAlarm.startTime.getTime()) / 1000
        } else
          programManualData.push({ programNo: -1, duration: (manualAlarm.endTime.getTime() - manualAlarm.startTime.getTime()) / 1000, intersection: 0 })
      }
    }
  } else {
    for (const stopAlarm of jobOrderStopAlarms) {
      stopAlarm.startTime = new Date(stopAlarm.startTime)
      stopAlarm.endTime = new Date(stopAlarm.endTime)
      if (!programManualData.includes(int => int.programNo !== stopAlarm.programNo))
        programManualData.push({ programNo: stopAlarm.programNo, intersection: 0, duration: 0 })
      const programIndex = programManualData.findIndex(int => int.programNo === stopAlarm.programNo)
      for (const manualAlarm of manualModeAlarms) {
        manualAlarm.startTime = new Date(manualAlarm.startTime)
        manualAlarm.endTime = new Date(manualAlarm.endTime)
        programManualData[programIndex].duration += (manualAlarm.endTime.getTime() - manualAlarm.startTime.getTime()) / 1000
        const manualStartTimeIsBetweenStop = stopAlarm.startTime <= manualAlarm.startTime && stopAlarm.endTime > manualAlarm.startTime
        const manualEndTimeIsBetweenStop = stopAlarm.endTime >= manualAlarm.endTime && stopAlarm.startTime < manualAlarm.endTime
        if (manualStartTimeIsBetweenStop || manualEndTimeIsBetweenStop) {
          const lowerBound = Math.max(stopAlarm.startTime.getTime(), manualAlarm.startTime.getTime())
          const upperBound = Math.min(stopAlarm.endTime.getTime(), manualAlarm.endTime.getTime())
          programManualData[programIndex].intersection += (upperBound - lowerBound)
        }
      }
      programManualData[programIndex].duration += (stopAlarm.endTime.getTime() - stopAlarm.startTime.getTime() - programManualData[programIndex].intersection) / 1000
    }
  }
  let totalManualDelay = 0
  programManualData.forEach(man => totalManualDelay += man.duration)
  // return programManualData

  const alarmDelays = await db('BAALARM')
    .select('PROGNO as programNo')
    .sum({ totalDuration: db.raw('DATEDIFF(second, STARTTIME, ENDTIME)') })
    .where('BATCHKEY', batchKey)
    .andWhere('ALARMTYPE', 0)
    .andWhere('ISPARALLEL', 0)
    .groupBy('PROGNO')
  const operatorDelay = await db('BAALARM')
    .select('PROGNO as programNo')
    .sum({ totalDuration: db.raw('DATEDIFF(second, STARTTIME, ENDTIME)') })
    .where('BATCHKEY', batchKey)
    .andWhere('ALARMTYPE', 3)
    .andWhere('ISPARALLEL', 0)
    .groupBy('PROGNO')

  const actualDurations = await db('BAACTUALPRGSTEPS')
    .select('PRGNO as programNo')
    .sum({ totalDuration: db.raw('DATEDIFF(second, STARTTIME, ENDTIME)') })
    .where('BATCHKEY', batchKey)
    .andWhere('PARALLELSTEPNO', 0)
    .groupBy('PRGNO')

  const theoreticalDurations = await db('BAACTUALPRGSTEPS as A')
    .select({
      programNo: 'A.PRGNO',
      programName: 'P.NAME',
      totalDuration: 'P.DURATION',
    })
    .where('B.BATCHKEY', batchKey)
    .join('BADATA as B', function () {
      this.on('B.BATCHKEY', '=', 'A.BATCHKEY')
    })
    .join('BFMASTERPRGHEADER as P', function () {
      this.on('P.PROGNO', '=', 'A.PRGNO')
        .andOn('P.MACHINEID', '=', 'B.MACHINEID')
    })
    .groupBy('A.PRGNO', 'P.NAME', 'P.DURATION')

  const interventionEvents = await db('BAINTERVENTION')
    .select('EVENTID')
    .select(db.raw('MAX(EXPLANATION) as EXPLANATION')) // Get the first explanation
    .where('BATCHKEY', batchKey)
    .groupBy('EVENTID')
  for (const int of interventionEvents) {
    int.EXPLANATION = int.EXPLANATION.split(/ ?,?\r ?/)[0]
  }

  let startDate = new Date((await db('BADATA').first('STARTTIME').where('BATCHKEY', batchKey)).STARTTIME)

  for (const program of theoreticalDurations) {
    const endDate = new Date(startDate.getTime() + program.totalDuration * 1000)
    program.startDate = startDate
    program.endDate = endDate

    program.interventions = await db('BAINTERVENTION')
      .select('EVENTID as eventId')
      .count('EVENTID as eventCount')
      .where('BATCHKEY', batchKey)
      .andWhere('INTERVENTTIME', '<=', program.endDate)
      .andWhere('INTERVENTTIME', '>', program.startDate)
      .groupBy('EVENTID')
      .orderBy('eventId', 'desc')

    for (const int of program.interventions) {
      int.explanation = interventionEvents.find(evt => int.eventId === evt.EVENTID).EXPLANATION
    }
    startDate = endDate
  }
  const batchData: any[] = []
  theoreticalDurations.forEach((program) => {
    const actualDuration = actualDurations.find(prg => prg.programNo === program.programNo)?.totalDuration || 0
    batchData.push(
      {
        programNo: program.programNo,
        programName: program.programName,
        startTime: program.startDate,
        endTime: program.endDate,
        theoreticalDuration: program.totalDuration,
        interventions: program.interventions,
        manualDelay: programManualData.find(prg => prg.programNo === program.programNo)?.duration || 0,
        // manualDelay: manualDelay.find(prg => prg.programNo === program.programNo)?.totalDuration || 0,
        alarmDelay: alarmDelays.find(prg => prg.programNo === program.programNo)?.totalDuration || 0,
        operatorDelay: operatorDelay.find(prg => prg.programNo === program.programNo)?.totalDuration || 0,
        actualDuration,
        deviation: actualDuration - program.totalDuration,
      },
    )
  })
  return { programInfo: batchData, totalManualDelay }
})
