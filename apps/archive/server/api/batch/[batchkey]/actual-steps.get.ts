import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const config = useRuntimeConfig()

  const steps = await db
    .with('distinct_steps', (qb) => {
      qb
        .from('BAACTUALPRGSTEPS')
        .select({
          batchKey: 'BATCHKEY',
          programNo: 'PRGNO',
          stepNo: 'STEPNO',
          startTime: db.raw(`DATEADD(MINUTE, ?, MIN(STARTTIME))`, config.teleskopTimezoneOffset),
          endTime: db.raw(`DATEADD(MINUTE, ?, MAX(ENDTIME))`, config.teleskopTimezoneOffset),
        })
        .where('BATCHKEY', batchKey)
        .groupBy('BATCHKEY', 'PRGNO', 'STEPNO')
    })
    .from('distinct_steps as ds')
    .select({
      programNo: 'ds.programNo',
      stepNo: 'ds.stepNo',
      startTime: 'ds.startTime',
      endTime: 'ds.endTime',
      commands: db.raw(/* sql */`(
        SELECT
          s.PARALLELSTEPNO [index]
        , s.COMMANDNO commandNo
        FROM BAACTUALPRGSTEPS s
        WHERE ds.batchKey = s.BATCHKEY
          AND ds.programNo = s.PRGNO
          AND ds.stepNo = s.STEPNO
        GROUP BY s.PARALLELSTEPNO, s.COMMANDNO
        ORDER BY s.PARALLELSTEPNO
        FOR JSON AUTO, INCLUDE_NULL_VALUES
      )`),
    })

  const modifiedSteps = steps.map((step) => {
    const [mainCommand, ...parallelCommands] = JSON.parse(step.commands)
    return {
      programNo: step.programNo,
      stepNo: step.stepNo,
      startTime: step.startTime,
      endTime: step.endTime,
      mainCommand,
      parallelCommands,
    }
  })

  return modifiedSteps
})
