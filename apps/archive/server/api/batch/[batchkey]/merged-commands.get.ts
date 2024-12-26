import { addMinutes } from 'date-fns'
import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const isArchiveData = 0
  const config = useRuntimeConfig()

  const result = await db.raw(`
    DECLARE @Result INT;

    EXEC spGetTheoricCommandNumbers
        @BatchKey = ?,
        @IsArchiveData = ?,
        @Result = @Result OUTPUT;

  `, [batchKey, isArchiveData])

  return result.map((step: any) => {
    return {
      theoreticalStepNo: step.THEORICSTEPNO,
      actualStepNo: step.ACTUALSTEPNO,
      programNo: step.PRGNO,
      commandNo: step.COMMANDNO,
      startTime: step.STARTTIME ? addMinutes(step.STARTTIME, config.teleskopTimezoneOffset) : null,
      endTime: step.ENDTIME ? addMinutes(step.ENDTIME, config.teleskopTimezoneOffset) : null,
      theoreticalDuration: step.THEORETICDURATION,
      stepStatus: step.STEPSTATUS,
      isFinished: step.ISWORKED,
    }
  })
})
