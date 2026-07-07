import { recalculateAllProgramDurations } from "../bulk/duration"
import { db } from "../database"

export default defineAuthEventHandler(async () => {
  const summary = await recalculateAllProgramDurations(db)
  return summary
})