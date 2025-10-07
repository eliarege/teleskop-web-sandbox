import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    if (!machineId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MACHINE_ID_REQUIRED',
      })
    }

    // Get all counters for this machine
    const allCounters = await knex('BFMACHCOUNTER')
      .select({
        id: 'ID',
        name: 'NAME',
      })
      .where('MACHINEID', machineId)

    // Get currently used counters for this machine
    const currentCounters = await knex('BFCONSUMPTIONCOUNTERS')
      .select('COUNTER1', 'COUNTER2')
      .where('MACHINEID', machineId)
      .first()

    // Get all used counters by other machines (excluding current machine)
    const usedCounters = await knex('BFCONSUMPTIONCOUNTERS')
      .select('COUNTER1', 'COUNTER2')
      .where('MACHINEID', '!=', machineId)
      .where(function () {
        this.whereNotNull('COUNTER1').orWhereNotNull('COUNTER2')
      })

    // Create a set of used counter IDs (excluding current machine's counters)
    const usedCounterIds = new Set()
    usedCounters.forEach((row) => {
      if (row.COUNTER1)
        usedCounterIds.add(row.COUNTER1)
      if (row.COUNTER2)
        usedCounterIds.add(row.COUNTER2)
    })

    // Filter out counters that are used by other machines
    // but keep counters that are currently used by this machine
    const availableCounters = allCounters.filter((counter) => {
      const isUsedByOtherMachine = usedCounterIds.has(counter.id)
      const isUsedByCurrentMachine = currentCounters && (
        currentCounters.COUNTER1 === counter.id
        || currentCounters.COUNTER2 === counter.id
      )

      return !isUsedByOtherMachine || isUsedByCurrentMachine
    })

    return availableCounters
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_SERVER_ERROR',
    })
  }
})
