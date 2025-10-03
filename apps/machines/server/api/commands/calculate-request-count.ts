import type { Knex } from 'knex'
import { knex } from '~/server/connectionPool'
import type { TCommandType } from '~/server/lib/enums'
import { AdditiveType, CommandType, ParameterType } from '~/server/lib/enums'

interface Program {
  machineId: number
  programNo: number
  steps: ProgramStep[]
}

interface ProgramStep {
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}

interface ProgramStepCommand {
  commandNo: number
  parameters: {
    value: number | string
    index: number
  }[]
}

export default defineAuthEventHandler(async (event) => {
  const { machineId } = await readBody(event)

  try {
    const machine = await knex
      .from('BFMACHINES')
      .where('MACHINEID', machineId)
      .first({ machineId: 'MACHINEID', tbbModel: 'TBBMODEL' })

    if (!machine) {
      throw createError({ statusCode: 404, message: 'Machine not found' })
    }

    let programs: Program[] = []

    await knex.transaction(async (trx) => {
      programs = await fetchPrograms(trx, machineId)
      for (const program of programs) {
        let chemRequestCounters: Map<TCommandType, number>
        if (machine.tbbModel === 'Tonello') {
          chemRequestCounters = await countTonelloChemicalRequests(program)
        } else {
          chemRequestCounters = await countChemicalRequests(program)
        }

        const manChemReq = chemRequestCounters.get(CommandType.ManChem) || 0
        const autoChemReq = chemRequestCounters.get(CommandType.AutoChem) || 0
        const manDyeReq = chemRequestCounters.get(CommandType.ManDye) || 0
        const autoDyeReq = chemRequestCounters.get(CommandType.AutoDye) || 0
        const totalChemReq = manChemReq + autoChemReq
        const totalDyeReq = manDyeReq + autoDyeReq

        await trx('BFMASTERPRGHEADER')
          .where('MACHINEID', program.machineId)
          .andWhere('PROGNO', program.programNo)
          .update({
            TotalChemReq: totalChemReq,
            TotalDyeReq: totalDyeReq,
            ManChemReq: manChemReq,
            ManDyeReq: manDyeReq,
            AutoChemReq: autoChemReq,
            AutoDyeReq: autoDyeReq,
          })
      }
    })

    return {
      success: true,
      message: `${programs.length} program için istek sayıları hesaplandı ve güncellendi.`,
      processedPrograms: programs.length,
    }
  } catch (err: any) {
    console.error('Request count calculation error:', err)
    return { error: err.message }
  }
})

function createChemicalRequestCountMap(): Map<TCommandType, number> {
  return new Map<TCommandType, number>([
    [CommandType.ManChem, 0],
    [CommandType.AutoChem, 0],
    [CommandType.ManDye, 0],
    [CommandType.AutoDye, 0],
  ])
}

/**
 * Programdaki toplam kimyasal ve boya istek sayısını hesaplar
 *
 * @param {Program} program - Program
 * @returns {Promise<Map<TCommandType, number>>} - Toplam istek sayılarını döndürür
 */
async function countChemicalRequests(program: Program): Promise<Map<TCommandType, number>> {
  const chemRequestCounters = createChemicalRequestCountMap()

  if (!program.steps.length)
    return chemRequestCounters

  const mappings = await fetchCommandTypeMappings(program.machineId)

  let activeRequests: number[] = []

  const handleCommand = (command: ProgramStepCommand) => {
    const { commandNo } = command
    const { commandType } = mappings.find(ct => ct.commandNo === commandNo) || {}
    if (commandType && !activeRequests.includes(commandNo)) {
      activeRequests.push(commandNo)
      chemRequestCounters.set(commandType, (chemRequestCounters.get(commandType) || 0) + 1)
    }
  }

  for (const step of program.steps) {
    const stepCommandNos: number[] = []

    handleCommand(step.mainCommand)
    stepCommandNos.push(step.mainCommand.commandNo)

    for (const parallelCommand of step.parallelCommands || []) {
      handleCommand(parallelCommand)
      stepCommandNos.push(parallelCommand.commandNo)
    }
    activeRequests = activeRequests.filter(cmdNo => stepCommandNos.includes(cmdNo))
  }

  return chemRequestCounters
}

async function countTonelloChemicalRequests(program: Program): Promise<Map<TCommandType, number>> {
  const chemRequestCounters = createChemicalRequestCountMap()

  if (!program.steps.length)
    return chemRequestCounters

  const commandsWithSelectableAdditives = await fetchCommandsWithSelectableAdditive(program.machineId)

  const incCounter = (type: TCommandType) => {
    chemRequestCounters.set(type, (chemRequestCounters.get(type) || 0) + 1)
  }

  for (const step of program.steps) {
    const command = step.mainCommand
    const commandWithAdditive = commandsWithSelectableAdditives.find(c => c.commandNo === command.commandNo)
    if (commandWithAdditive) {
      let additionType = command.parameters[commandWithAdditive.parameterIndex].value
      additionType = typeof additionType === 'string' ? Number.parseInt(additionType) : additionType
      incCounter(additionType === AdditiveType.Chemical ? CommandType.AutoChem : CommandType.AutoDye)
    }
  }

  return chemRequestCounters
}

async function fetchCommandsWithSelectableAdditive(machineId: number): Promise<{ commandNo: number, parameterIndex: number }[]> {
  return await knex
    .from('BFCOMMANDPARAMETERS')
    .select({
      commandNo: 'COMMANDNO',
      parameterIndex: 'PARAMETERINDEX',
    })
    .where('PARAMETERTYPE', ParameterType.SelectAdditive)
    .andWhere('MACHINEID', machineId)
}

async function fetchCommandTypeMappings(machineId: number): Promise<{ commandType: TCommandType, commandNo: number }[]> {
  return await knex
    .from('BFCOMMANDTYPES as CT')
    .select({
      commandType: 'CT.commandType',
      commandNo: 'CT.commandNo',
    })
    .where('CT.machineId', machineId)
}

async function fetchPrograms(trx: Knex.Transaction, machineId: number): Promise<Program[]> {
  const rawPrograms = await trx
    .from('BFMASTERPRGHEADER')
    .select({
      machineId: 'MACHINEID',
      programNo: 'PROGNO',
    })
    .andWhere('MACHINEID', machineId)

  if (!rawPrograms.length) {
    return []
  }

  const rawCommands = await trx
    .from('BFMASTERSTEPS')
    .select({
      programNo: 'PROGNO',
      mainStep: 'MAINSTEP',
      parallelStep: 'PARALELSTEP',
      commandNo: 'COMMANDNO',
    })
    .where('MACHINEID', machineId)
    .orderBy(['PROGNO', 'MAINSTEP', 'PARALELSTEP']) as {
    programNo: number
    mainStep: number
    parallelStep: number
    commandNo: number
  }[]

  const rawParameters = await trx
    .from('BFMASTERSTEPPARAMS')
    .select({
      programNo: 'PROGNO',
      mainStep: 'MAINSTEP',
      parallelStep: 'PARALELSTEP',
      value: trx.raw(`TRY_CAST(REPLACE(VALUE, ',', '.')  AS FLOAT)`),
      index: 'PARAMETERINDEX',
    })
    .where('MACHINEID', machineId)
    .orderBy(['PROGNO', 'MAINSTEP', 'PARALELSTEP', 'PARAMETERINDEX']) as {
    programNo: number
    mainStep: number
    parallelStep: number
    value: number
    index: number
  }[]

  const programs: Program[] = []
  let cmdCursor = 0
  let parCursor = 0

  for (let i = 0; i < rawPrograms.length; i++) {
    const program: Program = {
      machineId,
      programNo: rawPrograms[i].programNo,
      steps: [],
    }
    programs.push(program)

    let currentStepIndex = 0
    let currentStep: ProgramStep = {
      mainCommand: null!,
      parallelCommands: [],
    }
    for (;cmdCursor < rawCommands.length; cmdCursor++) {
      const rawCommand = rawCommands[cmdCursor]
      // If command is not for current program, break
      if (rawCommand.programNo !== program.programNo) {
        break
      }
      // Push current step, proceed to next one
      if (rawCommand.mainStep !== currentStepIndex) {
        // If mainCommand is not initialised for some reason, skip
        if (currentStep.mainCommand) {
          program.steps.push(currentStep)
        }
        currentStepIndex = rawCommand.mainStep
        currentStep = {
          mainCommand: null!,
          parallelCommands: [],
        }
      }
      const currentCommand: ProgramStepCommand = {
        commandNo: rawCommand.commandNo,
        parameters: [],
      }
      if (!currentStep.mainCommand) {
        currentStep.mainCommand = currentCommand
      } else {
        currentStep.parallelCommands.push(currentCommand)
      }
      for (;parCursor < rawParameters.length; parCursor++) {
        const rawParameter = rawParameters[parCursor]
        if (rawParameter.programNo !== rawCommand.programNo
          || rawParameter.parallelStep !== rawCommand.parallelStep
          || rawParameter.mainStep !== rawCommand.mainStep) {
          break
        }
        currentCommand.parameters.push({
          index: rawParameter.index,
          value: rawParameter.value,
        })
      }
    }
    // If mainCommand is not initialised for some reason, skip
    if (currentStep.mainCommand) {
      program.steps.push(currentStep)
    }
  }

  return programs
}
