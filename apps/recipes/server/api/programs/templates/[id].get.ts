import z from 'zod/v4'
import { dmsDB } from '~/server/connectionPool'
import type { ManualStep } from '~/shared/types'

const querySchema = z.object({
  machineId: z.coerce.number(),
})

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = await getValidatedQuery(event, querySchema.parse)

  // Fetch regular materials (step_no != -1).
  // PROGRAM_TEMPLATE_STEP is now one row per step; material details live in
  // PROGRAM_TEMPLATE_STEP_MATERIAL. Steps with no materials are intentionally
  // excluded here via whereNotNull('mat.material_code') to preserve the
  // historical response shape (empty step orderNos are still persisted in the
  // table and are read directly by the teleskop sync).
  const materials = await dmsDB('PROGRAM_TEMPLATE_STEP as s')
    .select({
      programNo: 's.program_no',
      stepNo: 's.step_no',
      type: 's.type',
      materialCode: 'mat.material_code',
      materialName: 'mat.material_name',
      isManual: 'mat.is_manual',
      unit: 'm.unit',
      amount: 'm.amount',
      nextStep: 's.next_step',
    })
    .leftJoin('PROGRAM_TEMPLATE_STEP_MATERIAL as m', 'm.step_id', 's.id')
    .leftJoin('MATERIAL as mat', 'm.material_code', 'mat.material_code')
    .where('s.program_no', id)
    .andWhere('s.machine_id', machineId)
    .andWhere('s.step_no', '!=', -1)
    .orderBy('s.step_no') as {
    programNo: string
    stepNo: number
    type: number
    materialCode: string | null
    materialName: string | null
    isManual: boolean | null
    unit: number | null
    amount: number | null
    nextStep: number | null
  }[]

  // Fetch intermediate materials (step_no = -1)
  const intermediateMaterials = await dmsDB('PROGRAM_TEMPLATE_STEP as s')
    .select({
      type: 's.type',
      materialCode: 'mat.material_code',
      materialName: 'mat.material_name',
      isManual: 'mat.is_manual',
      unit: 'm.unit',
      amount: 'm.amount',
      nextStep: 's.next_step',
    })
    .leftJoin('PROGRAM_TEMPLATE_STEP_MATERIAL as m', 'm.step_id', 's.id')
    .leftJoin('MATERIAL as mat', 'm.material_code', 'mat.material_code')
    .where('s.program_no', id)
    .andWhere('s.machine_id', machineId)
    .andWhere('s.step_no', -1)
    .whereNotNull('s.next_step')
    .whereNotNull('mat.material_code')
    .orderBy('s.next_step')

  const program: {
    programNo: string
    steps: {
      type: number
      materials: any[]
      stepNo: number
    }[]
    manualSteps: ManualStep[]
  } = {
    programNo: id,
    steps: [],
    manualSteps: [],
  }

  materials.forEach((row) => {
    let programSteps = program.steps.find(s => s.type === row.type && s.stepNo === row.stepNo)
    if (!programSteps) {
      programSteps = { type: row.type, materials: [], stepNo: row.stepNo }
      program.steps.push(programSteps)
    }
    if (row.materialCode !== null) {
      programSteps.materials.push({
        materialCode: row.materialCode,
        materialName: row.materialName,
        type: row.type,
        unit: row.unit,
        isManual: row.isManual,
        amount: Number(row.amount),
        orderNo: row.stepNo,
        nextStep: row.nextStep,
      })
    }
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
      programIndex: 0,
      calculated: 0,
    })
  })

  return program
})
