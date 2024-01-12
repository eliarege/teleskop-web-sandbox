import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineEventHandler(async () => {
  /*  const treatmentParameter: TreatmentParameter[] = await knex('BFTREATMENTPARAMETERS')
    .select({
      id: 'ID',
      unit: 'UNIT',
      treatmentParameter: 'TREATMENTPARAMETER',
      minValue: 'MINVALUE',
      maxValue: 'MAXVALUE',
    },
    )
  return treatmentParameter */

  return await knex.raw(`SELECT map.PARAMID ,map.GROUPID ,map.COMMANDNO ,map.PARAMETERINDEX, prm.TREATMENTPARAMETER, grp.GROUPNAME, mach.MACHINEID, cmd.NAME, cmdPrm.PARAMSTRING FROM BFTREATMENTPARAMGROUPMAP map
    LEFT JOIN BFTREATMENTPARAMETERS prm ON map.PARAMID = prm.ID
    LEFT JOIN BFTREATMENTPARAMETERGROUPS grp ON map.GROUPID = grp.ID
    OUTER APPLY ( SELECT TOP 1 g.MACHINEID FROM BFTREATMENTPARAMETERGROUPMACHINES g WHERE g.GROUPID = map.GROUPID ) as mach
    LEFT JOIN BFMASTERCOMMANDS cmd ON mach.MACHINEID = cmd.MACHINEID AND cmd.COMMANDNO = map.COMMANDNO
    LEFT JOIN BFCOMMANDPARAMETERS cmdPrm ON mach.MACHINEID = cmdPrm.MACHINEID AND cmdPrm.COMMANDNO = map.COMMANDNO AND cmdPrm.PARAMETERINDEX = map.PARAMETERINDEX
    ORDER BY map.GROUPID, map.PARAMID ,map.COMMANDNO ,map.PARAMETERINDEX ASC`)
})
