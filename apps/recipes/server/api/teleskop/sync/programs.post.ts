// TODO: Kimyasal/Boya zavazingo
import knex, { Knex } from 'knex'
import { dmsDB, getTeleskopDB } from '~/server/connectionPool'
import { RecipeType } from '~/shared/constants'
import { batchInsert } from '~/server/utils/utils'

export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const eliarData = await importEliarProgramData(teleskopDB)
    const tonelloData = await importTonelloProgramData(teleskopDB)

    await dmsDB.transaction(async (trx) => {
      const existingProgramData = await fetchExistingProgramData(trx)
      const result = syncProgramRecords([...eliarData, ...tonelloData], existingProgramData)

      if (result.programInserts.length > 0) {
        const programHeaderData = result.programInserts.map(p => p.header)
        await trx.batchInsert('PROGRAM_HEADER', programHeaderData)

        const stepData = result.programInserts.flatMap(p => p.steps)
        await trx.batchInsert('PROGRAM_TEMPLATE_STEP', stepData)
      }
      if (result.programUpdates.length > 0) {
        const intBind = `?::integer`
        const txtBind = `?::text`
        const placeholders = result.programUpdates.map(() => `(${[
          intBind, // machine_id
          intBind, // program_no
          txtBind, // program_name
          intBind, // chem_requests
          intBind, // dye_requests
          intBind, // salt_requests
        ]})`).join(', ');
        const bindings = result.programUpdates.flatMap(p => [
          p.machine_id,
          p.program_no,
          p.program_name,
          p.chem_requests,
          p.dye_requests,
          p.salt_requests
        ]);
        await trx('PROGRAM_HEADER as p')
          .update({
            program_name: trx.ref('data.new_name'),
            dye_requests: trx.ref('data.new_dye'),
            chem_requests: trx.ref('data.new_chem'),
            salt_requests: trx.ref('data.new_salt')
          })
          .updateFrom(
            trx.raw(`(VALUES ${placeholders}) AS data(m_id, p_no, new_name, new_chem, new_dye, new_salt)`, bindings)
          )
          .where('p.machine_id', '=', trx.ref('data.m_id'))
          .andWhere('p.program_no', '=', trx.ref('data.p_no'));
      }
      if (result.programDeletes.length > 0) {
        await trx('PROGRAM_HEADER')
          .whereIn(['machine_id', 'program_no'], result.programDeletes.map(p => [p.machine_id, p.program_no]))
          .del()
      }
      if (result.stepDeletes.length > 0) {
        await trx('PROGRAM_TEMPLATE_STEP')
          .whereIn(['machine_id', 'program_no', 'step_no'], result.stepDeletes.map(s => [s.machine_id, s.program_no, s.step_no]))
          .del()
      }
      if (result.stepInserts.length > 0) {
        await trx.batchInsert('PROGRAM_TEMPLATE_STEP', result.stepInserts)
      }
    })
  } catch (e) {
    console.error(e)
    return e
  }
})

type ImportedProgramData = {
  header: ProgramHeaderRaw
  steps: ProgramTemplateStepRaw[]
}

async function importTonelloProgramData(teleskopDB: Knex): Promise<ImportedProgramData[]> {
  const programs = await fetchTonelloPrograms(teleskopDB)
  const selectableAdditiveParameters = await fetchSelectableAdditiveParameters(teleskopDB)
  const machineIdToParametersMap = Map.groupBy(selectableAdditiveParameters, p => p.machineId)

  return programs.map(program => {
    const additiveParameters = machineIdToParametersMap.get(program.machineId) ?? []
    const requests = findTonelloChemicalRequests(program, additiveParameters)
    const chemRequests = requests.filter(r => r.type === CommandType.AutoChem)
    const dyeRequests = requests.filter(r => r.type === CommandType.AutoDye)

    const data: ImportedProgramData = {
      header: {
        program_no: program.programNo,
        machine_id: program.machineId,
        program_name: program.name,
        program_type: null,
        chem_requests: chemRequests.length,
        dye_requests: dyeRequests.length,
        salt_requests: 0,
      },
      steps: [],
    }

    if (chemRequests.length > 0) {
      for (const request of chemRequests) {
        data.steps.push({
          program_no: program.programNo,
          machine_id: program.machineId,
          type: RecipeType.CHEM,
          step_no: request.orderNo,
          next_step: null,
        })
      }
    }

    if (dyeRequests.length > 0) {
      for (const request of dyeRequests) {
        data.steps.push({
          program_no: program.programNo,
          machine_id: program.machineId,
          type: RecipeType.DYE,
          step_no: request.orderNo,
          next_step: null,
        })
      }
    }
    return data
  })
}

async function importEliarProgramData(teleskopDB: Knex): Promise<ImportedProgramData[]> {
  const programs = await teleskopDB
    .from('BFMASTERPRGHEADER AS P')
    .select({
      name: 'P.NAME',
      programNo: 'P.PROGNO',
      machineId: 'P.MACHINEID',
      chemRequests: 'P.TotalChemReq',
      dyeRequests: 'P.TotalDyeReq',
      saltRequests: 'P.TOTALSALTREQ',
    })
    .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
    .where('M.TBBMODEL', '<>', 'Tonello')
    .orderBy(['M.MACHINEID', 'P.PROGNO']) as TeleskopProgramHeader[]


  return programs.map(program => {
    const data: ImportedProgramData = {
      header: {
        program_no: program.programNo,
        machine_id: program.machineId,
        program_name: program.name,
        program_type: null,
        chem_requests: program.chemRequests,
        dye_requests: program.dyeRequests,
        salt_requests: program.saltRequests,
      },
      steps: [],
    }

    let stepNo = 1

    for (const type of [RecipeType.CHEM, RecipeType.DYE, RecipeType.SALT]) {
      const requestCount = type === RecipeType.CHEM
        ? program.chemRequests
        : type === RecipeType.DYE
          ? program.dyeRequests
          : program.saltRequests

      if (requestCount > 0) {
        data.steps.push({
          program_no: program.programNo,
          type: type,
          machine_id: program.machineId,
          step_no: stepNo,
          next_step: null,
        })
        stepNo++
      }
    }

    return data
  })
}

async function fetchExistingProgramData(trx: Knex): Promise<ImportedProgramData[]> {
  const programHeaders = await trx('PROGRAM_HEADER').select('*') as ProgramHeaderRaw[]
  const programSteps = await trx('PROGRAM_TEMPLATE_STEP').select('*') as ProgramTemplateStepRaw[]

  const programKey = (header: Pick<ProgramHeaderRaw, 'machine_id' | 'program_no'>) =>
    `${header.machine_id}-${header.program_no}`

  const programNoToStepsMap = Map.groupBy(programSteps, programKey)

  return programHeaders.map(header => {
    const steps = programNoToStepsMap.get(programKey(header)) ?? []
    return {
      header,
      steps,
    }
  })
}

function areProgramHeadersEqual(a: ProgramHeaderRaw, b: ProgramHeaderRaw): boolean {
  return a.program_name === b.program_name
    && a.chem_requests === b.chem_requests
    && a.dye_requests === b.dye_requests
    && a.salt_requests === b.salt_requests
}

function areProgramStepsEqual(a: ProgramTemplateStepRaw[], b: ProgramTemplateStepRaw[]): boolean {
  if (a.length !== b.length)
    return false
  const key = (s: ProgramTemplateStepRaw) => `${s.step_no}-${s.type}`
  const aKeys = a.map(key).sort().join(',')
  const bKeys = b.map(key).sort().join(',')
  return aKeys === bKeys
}

function syncProgramRecords(incoming: ImportedProgramData[], existing: ImportedProgramData[]) {

  const programKey = (header: Pick<ProgramHeaderRaw, 'machine_id' | 'program_no'>) =>
    `${header.machine_id}-${header.program_no}`

  const existingProgramMap = new Map(existing.map(p => [programKey(p.header), p]))
  const incomingProgramMap = new Map(incoming.map(p => [programKey(p.header), p]))

  const programInserts: ImportedProgramData[] = [] // These are program + step insertions.
  const programUpdates: ProgramHeaderRaw[] = [] // These are program updates (program header updates).
  const programDeletes: ProgramHeaderRaw[] = [] // These are program header deletions. Steps are cascade-lost.
  const stepInserts: ProgramTemplateStepRaw[] = [] // Auto steps to insert for existing programs whose step structure changed (old auto steps are wiped and reinserted from incoming).
  const stepDeletes: ProgramTemplateStepRaw[] = [] // Auto steps to delete for existing programs whose step structure changed. Materials on these cascade-lost.

  for (const [key, incomingProgram] of incomingProgramMap) {
    const existing = existingProgramMap.get(key)
    if (!existing) {
      // New program, insert program + steps.
      programInserts.push(incomingProgram)
      continue
    }

    // Existing program, check for step differences.
    // Only auto steps (step_no !== -1) are managed by sync. Manual steps (step_no = -1)
    // are user-authored in the recipes app and must be left untouched.
    const existingAutoSteps = existing.steps.filter(s => s.step_no !== -1)
    const incomingSteps = incomingProgram.steps

    if (!areProgramStepsEqual(existingAutoSteps, incomingSteps)) {
      // Auto-step structure changed: delete all existing auto steps and reinsert from
      // incoming. Materials on deleted auto steps are cascade-lost (no-guesses rule:
      // materials are only preserved when the request structure is identical). Manual
      // steps (step_no = -1) are preserved. Only step_no + type are compared; next_step
      // and materials are user-editable and not part of the structural diff.
      stepDeletes.push(...existingAutoSteps)
      stepInserts.push(...incomingSteps)
    }

    // Check if the program header has changed.
    if (!areProgramHeadersEqual(incomingProgram.header, existing.header)) {
      programUpdates.push(incomingProgram.header)
    }
  }

  for (const [key, existingProgram] of existingProgramMap) {
    if (!incomingProgramMap.has(key)) {
      programDeletes.push(existingProgram.header)
    }
  }


  return {
    programInserts,
    programUpdates,
    programDeletes,
    stepInserts,
    stepDeletes,
  }
}

//#region

interface ProgramHeaderRaw {
  machine_id: number
  program_no: number
  program_name: string
  program_type: number | null
  chem_requests: number
  dye_requests: number
  salt_requests: number
}

interface ProgramTemplateStepRaw {
  program_no: number
  machine_id: number
  type: RecipeType
  step_no: number
  next_step: number | null
}

interface TeleskopProgramHeader {
  name: string
  programNo: number
  machineId: number
  chemRequests: number
  dyeRequests: number
  saltRequests: number
}

interface TeleskopProgram extends TeleskopProgramHeader {
  steps: TeleskopProgramStepCommand[]
}

interface TeleskopProgramStepCommand {
  commandNo: number
  parameters: {
    value: number | string
    index: number
  }[]
}

const ParameterTypeRaw = {
  NUMBER: 0,
  SELECT: 1,
  CHECKBOX: 2,
  SELECT_ADDITIVE: 3,
} as const

const CommandType = {
  AutoChem: 100,
  ManChem: 101,
  AutoDye: 200,
  ManDye: 201,
  ChemTankTransfer: 300,
  PaintTankTransfer: 400,
  ReserveTankTransfer: 500,
  PHControl: 600,
  TakeSample: 700,
  SaltRequest: 800,
  GenericMaterial1: 810,
  GenericMaterial2: 820,
  ManualMeasurement: 1000,
} as const

type CommandType = (typeof CommandType)[keyof typeof CommandType]

const AdditiveType = {
  Chemical: 0,
  Dye: 1,
} as const

type SelectableAdditiveParameter = {
  machineId: number
  commandNo: number
  parameterIndex: number
}

async function fetchSelectableAdditiveParameters(teleskopDB: Knex): Promise<SelectableAdditiveParameter[]> {
  return await teleskopDB
    .from('BFCOMMANDPARAMETERS')
    .select({
      machineId: 'MACHINEID',
      commandNo: 'COMMANDNO',
      parameterIndex: 'PARAMETERINDEX',
    })
    .where('PARAMETERTYPE', ParameterTypeRaw.SELECT_ADDITIVE)
}

async function fetchTonelloPrograms(teleskopDB: Knex): Promise<TeleskopProgram[]> {
  const programs = await teleskopDB
    .select({
      name: 'P.NAME',
      programNo: 'P.PROGNO',
      machineId: 'P.MACHINEID',
      chemRequests: 'P.TotalChemReq',
      dyeRequests: 'P.TotalDyeReq',
      saltRequests: 'P.TOTALSALTREQ',
    })
    .from('BFMASTERPRGHEADER AS P')
    .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
    .where('M.TBBMODEL', 'Tonello')
    .orderBy(['M.MACHINEID', 'P.PROGNO']) as TeleskopProgram[]

  const rawCommands = await teleskopDB
    .from('BFMASTERSTEPS as P')
    .select({
      machineId: 'P.MACHINEID',
      programNo: 'P.PROGNO',
      stepNo: 'P.MAINSTEP',
      commandNo: 'P.COMMANDNO',
    })
    .where('P.PARALELSTEP', 0)
    .orderBy(['P.MACHINEID', 'P.PROGNO', 'P.MAINSTEP', 'P.PARALELSTEP']) as {
      machineId: number
      programNo: number
      stepNo: number
      commandNo: number
    }[]

  const rawParameters = await teleskopDB
    .from('BFMASTERSTEPPARAMS as P')
    .select({
      machineId: 'P.MACHINEID',
      programNo: 'P.PROGNO',
      stepNo: 'P.MAINSTEP',
      value: teleskopDB.raw(`TRY_CAST(REPLACE(P.VALUE, ',', '.')  AS FLOAT)`),
      index: 'P.PARAMETERINDEX',
    })
    .where('P.PARALELSTEP', 0)
    .orderBy(['P.MACHINEID', 'P.PROGNO', 'P.MAINSTEP', 'P.PARAMETERINDEX']) as {
      machineId: number
      programNo: number
      stepNo: number
      value: number
      index: number
    }[]


  let cmdCursor = 0
  let parCursor = 0

  for (const program of programs) {
    program.steps = []

    let currentStepNo = -1
    let currentCommand: TeleskopProgramStepCommand

    for (; cmdCursor < rawCommands.length; cmdCursor++) {
      const rawCommand = rawCommands[cmdCursor]
      if (rawCommand.machineId !== program.machineId || rawCommand.programNo !== program.programNo) {
        break
      }
      if (rawCommand.stepNo !== currentStepNo) {
        currentStepNo = rawCommand.stepNo
        currentCommand = {
          commandNo: rawCommand.commandNo,
          parameters: [],
        }
        program.steps.push(currentCommand)
      }
      for (; parCursor < rawParameters.length; parCursor++) {
        const rawParameter = rawParameters[parCursor]
        if (rawParameter.machineId !== program.machineId || rawParameter.programNo !== program.programNo || rawParameter.stepNo !== rawCommand.stepNo) {
          break
        }
        currentCommand!.parameters.push({
          value: rawParameter.value,
          index: rawParameter.index,
        })
      }
    }
  }

  return programs
}

function findTonelloChemicalRequests(program: TeleskopProgram, selectableAdditiveParameters: SelectableAdditiveParameter[]): { type: CommandType, orderNo: number }[] {
  if (!program.steps.length)
    return []

  const requests: { type: CommandType, orderNo: number }[] = []
  let orderNo = 1

  for (const step of program.steps) {
    const parameter = selectableAdditiveParameters.find(c => c.commandNo === step.commandNo)
    if (parameter) {
      let additionType = step.parameters[parameter.parameterIndex].value
      additionType = typeof additionType === 'string' ? Number.parseInt(additionType) : additionType
      requests.push({
        type: additionType === AdditiveType.Chemical
          ? CommandType.AutoChem
          : CommandType.AutoDye,
        orderNo: orderNo++,
      })
    }
  }

  return requests
}

//#endregion
