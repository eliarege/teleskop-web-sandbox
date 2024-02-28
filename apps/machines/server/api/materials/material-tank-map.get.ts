import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  const tanks = await knex('BFMACHINETANKS')
    .where('MACHINEID', machineId)
    .select({
      machineId: 'MACHINEID',
      tankName: 'NAME',
      tankNo: 'TANKNO',
      materials: knex.raw(`ISNULL((
        select
          ID as materialId,
          DYTFMATERIALTANKMAP.MATERIALCODE as materialCode,
          DYTFMATERIALTANKMAP.MACHINEID as machineId,
          DYTFMATERIAL.MATERIALNAME as materialName,
          DYTFMATERIAL.MADDEGRUPNO as materialGroupNo,
          PREWATER as preWater,
          BETWEENWATER as betweenWater,
          POSTWATER as postWater
        from DYTFMATERIALTANKMAP
        left join DYTFMATERIAL on DYTFMATERIAL.MATERIALCODE = DYTFMATERIALTANKMAP.MATERIALCODE
        where DYTFMATERIALTANKMAP.TANKNO = BFMACHINETANKS.TANKNO
        and  DYTFMATERIALTANKMAP.MACHINEID = BFMACHINETANKS.MACHINEID
        for json path, INCLUDE_NULL_VALUES
      ), '[]')`),
    })

  return tanks.map(t => ({
    ...t,
    materials: JSON.parse(t.materials),
  }))
})
