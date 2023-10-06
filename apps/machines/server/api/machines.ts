
import connectionPool from "../connectionPool"

export default defineEventHandler(async ()=> {
  await connectionPool.pool.connect()
  const response = await connectionPool.pool.query(`select
  MACHINEID, MACHINECODE, TBBMODEL, VERSION,
  MACHINECAPACITY, IP,INUSE, PlcModel, NOZZLECOUNT, GROUPNAME
  from BFMACHINES
  left join BFMACHGROUP on BFMACHINES.GRUPNO = BFMACHGROUP.GROUPID
  where GRUPNO != -1
  `)
  return response.recordset
})
