import { dmsDB, getTeleskopDB } from '~/server/connectionPool'

const programHeaderParams = {
  machine_id: 'MACHINEID',
  program_no: 'PROGNO',
  program_name: 'NAME',
  chem_requests: 'TotalChemReq',
  dye_requests: 'TotalDyeReq',
  salt_requests: 'TOTALSALTREQ'
}


export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const programHeaders = await teleskopDB('dbo.BFMASTERPRGHEADER')
      .select(programHeaderParams)

    const batchSize = 3000
    await batchInsert(dmsDB, programHeaders, batchSize, 'PROGRAM_HEADER', ['machine_id', 'program_no'])
  } catch (e) {
    console.error(e)
    return e
  }
})
