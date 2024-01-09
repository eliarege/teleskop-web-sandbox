import { teleskopDB } from '~/server/connectionPool'

const selectParameters = {
  jobId: 'r.BATCHNO',
  batchCorrectionNo: 'r.BATCHCORRECTIONNO',
  machineName: 'm.MACHINENAME',
  machineId: 'm.MACHINEID',
  tankNo: 'r.TANKNO',
  programNo: 'r.PROGRAMNO',
  programName: 'p.NAME',
  recipeType: 'r.ACTUALRECIPETYPE',
  recipeProcessNo: 'r.RECIPEINDEX',
  stepNo: 'r.PROGRAMSTEPNO',
  recipeStepNo: 'r.RECIPESTEPNO',
  status: 'r.STATUS',
  dispenserId: 'r.DISPENSERID',
  dispenserName: 'd.NAME'
}
export default defineEventHandler(async (event) => {
  const { isCanceled } = getQuery(event)
  try {
    const result = teleskopDB('dbo.DYTFCHEMREQUESTS as r')
      .join('dbo.DYTFMACHINES as m', 'r.MACHINEID', 'm.MACHINEID')
      .leftJoin('dbo.DYTFDISPENSERSETTINGS as d', 'r.DISPENSERID', 'd.DISPENSERID')
      .leftJoin('dbo.BFMASTERPRGHEADER as p', (builder) => {
        builder
          .on('r.PROGRAMNO', '=', 'p.PROGNO')
          .andOn('r.MACHINEID', '=', 'p.MACHINEID')
      })
      .select(selectParameters)
      .orderBy('r.REQNUMBER', 'asc')
      //.where((builder) => {
        //if (isCanceled === 'true') {
          //builder.where('r.STATUS', 3)
            //.orWhere('r.STATUS', 8)
        //} else {
          //builder.whereNot('r.STATUS', 3)
            //.andWhereNot('r.STATUS', 8)
        //}
      //})
      //result.limit(1000)
      return result

  } catch (e) {
    return e
  }
})
