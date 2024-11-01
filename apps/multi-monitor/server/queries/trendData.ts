import { knex } from '../knexConfig'
import type { Trends } from '~/shared/types'

export async function getTrendData(): Promise<Trends> {
  const currentWeekData = await knex('BACONSUMPTION AS c')
    .select({
      currentWeekTotalWater: knex.raw('COALESCE(SUM(c.WaterTotal), 0)'),
      currentWeekElectricity: knex.raw('COALESCE(SUM(c.ELECTRICITY), 0)'),
      currentWeekFM: knex.raw('COALESCE(SUM(c.FM1VALUE), 0)'),
      currentWeekSalt: knex.raw('COALESCE(SUM(c.SALT), 0)'),
      currentWeekSteam: knex.raw('COALESCE(SUM(c.STEAM), 0)'),
    })
    .innerJoin(
      knex('BADATA AS r').select('r.BATCHKEY', 'r.STARTTIME').as('r'),
      'c.BATCHKEY',
      'r.BATCHKEY',
    )
    .whereBetween('r.STARTTIME', [
      knex.raw('dateadd(day, (2 - datepart(weekday, getdate())), cast(getdate() as date))'),
      knex.raw('dateadd(day,(2 - datepart(weekday, getdate())),cast(getdate()+7 AS date))'),
    ])

  const lastWeekData = await knex('BACONSUMPTION AS c')
    .select({
      lastWeekTotalWater: knex.raw('COALESCE(SUM(c.WaterTotal), 0)'),
      lastWeekElectricity: knex.raw('COALESCE(SUM(c.ELECTRICITY), 0)'),
      lastWeekFM: knex.raw('COALESCE(SUM(c.FM1VALUE), 0)'),
      lastWeekSalt: knex.raw('COALESCE(SUM(c.SALT), 0)'),
      lastWeekSteam: knex.raw('COALESCE(SUM(c.STEAM), 0)'),
    })
    .innerJoin(
      knex('BADATA AS r').select('r.BATCHKEY', 'r.STARTTIME').as('r'),
      'c.BATCHKEY',
      'r.BATCHKEY',
    )
    .whereBetween('r.STARTTIME', [
      knex.raw('dateadd(day,(2 - datepart(weekday, dateadd(week, -1, getdate()))),cast(dateadd(week, -1, getdate()) AS date))'),
      knex.raw('dateadd(day,(2 - datepart(weekday, getdate())),cast(getdate() as date))'),
    ])
  return {
    ...currentWeekData[0],
    ...lastWeekData[0],
  }
}
