import { dmsDB } from '~/server/connectionPool'
import type { ManualStep, RecipeMasterMaterial } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)

  // Fetch regular materials (step_no != -1)
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
      nextStep: 's.next_step',
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
    .where('s.step_no', '!=', -1) // Exclude intermediate steps
    .distinctOn(['s.step_no', 'mat.material_code'])
    .orderBy('s.step_no')

  // Fetch intermediate materials (step_no = -1)
  const intermediateMaterials = await dmsDB('PROGRAM_TEMPLATE_STEP as s')
    .select({
      type: 's.type',
      materialCode: 'mat.material_code',
      materialName: 'mat.material_name',
      isManual: 'mat.is_manual',
      unit: 's.unit',
      amount: 's.amount',
      nextStep: 's.next_step',
    })
    .leftJoin('MATERIAL as mat', 's.material_code', 'mat.material_code')
    .where('s.program_no', id)
    .andWhere('s.machine_id', machineId)
    .andWhere('s.step_no', -1)
    .whereNotNull('s.next_step')
    .whereNotNull('mat.material_code')
    .orderBy('s.next_step')

  const program: {
    programNo: string
    steps: { type: number, materials: any[] }[]
    manualSteps: ManualStep[]
  } = {
    programNo: id,
    steps: [],
    manualSteps: [],
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
      nextStep: row.nextStep,
    })
  })

  // Add manual steps
  intermediateMaterials.forEach((row: any) => {
    let intStep = program.manualSteps.find((is: ManualStep) => is.nextStep === row.nextStep && is.type === row.type)
    if (!intStep) {
      intStep = { nextStep: row.nextStep, type: row.type, materials: [] }
      program.manualSteps.push(intStep)
    }
    intStep.materials.push({
      materialCode: row.materialCode,
      materialName: row.materialName,
      type: row.type,
      unit: row.unit,
      isManual: row.isManual,
      amount: Number(row.amount),
      orderNo: -1,
      nextStep: row.nextStep,
    })
  })

  return program
})
