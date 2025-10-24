import { dmsDB } from '~/server/connectionPool'
import type { RecipeMasterMaterial } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)

  const materials = await dmsDB('PROGRAM_TEMPLATE as t')
    .select({
      programNo: 't.program_no',
      orderNo: 's.step_no',
      type: 's.type',
      materialCode: 'mat.material_code',
      materialName: 'mat.material_name',
      isManual: 'mat.is_manual',
      unit: 's.unit',
      amount: 's.amount',
    })
    .leftJoin('PROGRAM_TEMPLATE_STEP as s', function () {
      this.on('s.program_no', '=', 't.program_no')
        .andOn('s.type', '=', 't.type')
        .andOnVal('s.machine_id', '=', machineId)
    })
    .leftJoin('PROGRAM_HEADER as p', function () {
      this.on('s.program_no', '=', 'p.program_no')
        .andOnVal('p.machine_id', '=', machineId)
    })
    .leftJoin('MATERIAL as mat', 's.material_code', 'mat.material_code')
    .where('t.program_no', id)
    .whereNotNull('mat.material_code')
    .distinctOn(['s.step_no', 'mat.material_code'])
    .orderBy('s.step_no')
  const program = {
    programNo: id,
    steps: [],
  }
  materials.forEach((row: RecipeMasterMaterial) => {
    let programSteps = program.steps.find(s => s.type === row.type)
    if (!programSteps) {
      programSteps = { type: row.type, materials: [] }
      program.steps.push(programSteps)
    }
    programSteps.materials.push({
      materialCode: row.materialCode,
      materialName: row.materialName,
      type: row.type,
      unit: row.unit,
      isManual: row.isManual,
      amount: Number(row.amount),
      orderNo: row.orderNo,
    })
  })
  return program
})
