import connection from '~/server/connectionPool'
import type { Recipe } from '~/shared/types'

export default defineEventHandler(async (event) => {
  await connection.pool.connect
  const { recipeJB } = getQuery(event)
  const { recipeID } = getQuery(event)
  const { teleskopType } = getQuery(event)
  const washingQuery = `
  SELECT
    p.RCPINDEX AS recIndex,
    p.RECIPENO AS recNo,
    h.NAME AS name,
    DYEREQUESTNUMBER AS reqNumber,
    MAINSTEP AS mainStep,
    PARALLELSTEP AS parallelStep,
    r.RECIPETYPE AS recType,
    CHEMCODE AS chemCode,
    m.MATERIALNAME AS materialName,
    AMOUNT AS amount,
    REQNO_BATCH AS reqBatchNo,
    REQNO_PROG AS reqProgNo,
    PHASENO AS phaseNo,
    PHASEINDEX as phaseIndex,
    otherUnit as unit
FROM
    DYBFBATCHORDERRECIPESTEPS r
    RIGHT JOIN DYBFBATCHORDERRECIPEHEADER p ON r.PLANKEY = p.PLANKEY
    and r.RCPINDEX = p.RCPINDEX
    and r.RECIPETYPE = p.RECIPETYPE
    LEFT JOIN BFMASTERPRGHEADER h ON p.RECIPENO = h.PROGNO
    and h.MACHINEID = '${recipeID}'
    LEFT JOIN DYTFMATERIAL m ON m.MATERIALCODE = r.CHEMCODE
WHERE
    p.PLANKEY = (
        SELECT
            TOP 1 PLANKEY
        FROM
            DYBFBATCHPLAN
        WHERE
            JOBORDER = '${recipeJB}'
        ORDER BY
            PLANKEY DESC
    )
    AND REQNO_BATCH IS NOT NULL
ORDER BY
    p.RCPINDEX,
    DYEREQUESTNUMBER,
    PARALLELSTEP

SELECT
    p.RCPINDEX AS recIndex,
    p.RECIPENO AS recNo,
    h.NAME AS name,
    DYEREQUESTNUMBER AS reqNumber,
    MAINSTEP AS mainStep,
    PARALLELSTEP AS parallelStep,
    r.RECIPETYPE AS recType,
    CHEMCODE AS chemCode,
    m.MATERIALNAME AS materialName,
    AMOUNT AS amount,
    REQNO_BATCH AS reqBatchNo,
    REQNO_PROG AS reqProgNo,
    otherUnit as unit
FROM
    DYBFBATCHORDERRECIPEMANUALS r
    LEFT JOIN DYBFBATCHORDERRECIPEHEADER p ON r.PLANKEY = p.PLANKEY
    and r.RCPINDEX = p.RCPINDEX
    LEFT JOIN BFMASTERPRGHEADER h ON p.RECIPENO = h.PROGNO
    and h.MACHINEID = '${recipeID}'
    LEFT JOIN DYTFMATERIAL m ON m.MATERIALCODE = r.CHEMCODE
WHERE
    p.PLANKEY = (
        SELECT
            TOP 1 PLANKEY
        FROM
            DYBFBATCHPLAN
        WHERE
            JOBORDER = '${recipeJB}'
        ORDER BY
            PLANKEY DESC
    )
    AND REQNO_BATCH IS NOT NULL
    AND AMOUNT != 0
ORDER BY
    p.RCPINDEX,
    DYEREQUESTNUMBER,
    PARALLELSTEP`
  const dyeingQuery = `SELECT
  p.RCPINDEX AS recIndex,
  p.RECIPENO AS recNo,
  h.NAME AS name,
  DYEREQUESTNUMBER AS reqNumber,
  MAINSTEP AS mainStep,
  PARALLELSTEP AS parallelStep,
  r.RECIPETYPE AS recType,
  CHEMCODE AS chemCode,
  m.MATERIALNAME AS materialName,
  AMOUNT AS amount,
  REQNO_BATCH AS reqBatchNo,
  REQNO_PROG AS reqProgNo,
  PHASENO AS phaseNo,
  PHASEINDEX as phaseIndex,
  otherUnit as unit
FROM DYBFBATCHORDERRECIPESTEPS r
RIGHT JOIN DYBFBATCHORDERRECIPEHEADER p ON r.PLANKEY = p.PLANKEY and r.RCPINDEX = p.RCPINDEX and r.RECIPETYPE = p.RECIPETYPE
LEFT JOIN BFMASTERPRGHEADER h ON p.RECIPENO = h.PROGNO and h.MACHINEID = '${recipeID}'
LEFT JOIN DYTFMATERIAL m ON m.MATERIALCODE = r.CHEMCODE
  WHERE p.PLANKEY = (SELECT TOP 1 PLANKEY FROM DYBFBATCHPLAN WHERE JOBORDER = '${recipeJB}' ORDER BY PLANKEY desc) AND REQNO_BATCH IS NOT NULL
  ORDER BY p.RCPINDEX, DYEREQUESTNUMBER, PARALLELSTEP

  SELECT
  p.RCPINDEX AS recIndex,
  p.RECIPENO AS recNo,
  h.NAME AS name,
  DYEREQUESTNUMBER AS reqNumber,
  MAINSTEP AS mainStep,
  PARALLELSTEP AS parallelStep,
  r.RECIPETYPE AS recType,
  CHEMCODE AS chemCode,
  m.MATERIALNAME AS materialName,
  AMOUNT AS amount,
  REQNO_BATCH AS reqBatchNo,
  REQNO_PROG AS reqProgNo,
  otherUnit as unit
FROM DYBFBATCHORDERRECIPEMANUALS r
LEFT JOIN DYBFBATCHORDERRECIPEHEADER p ON r.PLANKEY = p.PLANKEY and r.RCPINDEX = p.RCPINDEX
LEFT JOIN BFMASTERPRGHEADER h ON p.RECIPENO = h.PROGNO and h.MACHINEID = '${recipeID}'
LEFT JOIN DYTFMATERIAL m ON m.MATERIALCODE = r.CHEMCODE
  WHERE p.PLANKEY = ( SELECT TOP 1 PLANKEY FROM DYBFBATCHPLAN WHERE JOBORDER = '${recipeJB}' ORDER BY PLANKEY DESC ) AND REQNO_BATCH IS NOT NULL AND AMOUNT != 0
  ORDER BY p.RCPINDEX, DYEREQUESTNUMBER, PARALLELSTEP`
  const response = await connection.pool.query<Recipe>(
    teleskopType === 'washing' ? washingQuery : dyeingQuery,
  )
  return response.recordset
})
