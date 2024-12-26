import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const config = useRuntimeConfig()

  const alarms = await db
    .from('BAALARM')
    .select({
      batchAlarmNo: 'BATCHALARMNO',
      alarmNo: 'ALARMNO',
      programNo: 'PROGNO',
      commandNo: 'COMMANDNO',
      startTime: db.raw(`DATEADD(MINUTE, ?, STARTTIME)`, config.teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, ENDTIME)`, config.teleskopTimezoneOffset),
      explanation: 'EXPLANATION',
      alarmType: 'ALARMTYPE',
      isParallel: 'ISPARALLEL',
    })
    .where('BATCHKEY', batchKey)
    .orderBy('STARTTIME')

  return alarms
})
