import nearley from 'nearley'
import type { BatchCommand, Machine, MachineBatchParameter, MachineCommand, MachineCommandFormula, MachineCommandParameter, MachineConstant, Program, ProgramStep, TheoreticalProgram } from '../types/archive'
import { grammar } from './grammar'

/**
 * Lütfen bu sayafadaki herhangi bir değişiklikten önce @egeiliklier 'e danışınız
 */
interface CalculationContext {
  temperature: number
  machine: Machine
}

export const ParameterType = {
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  SELECT_ADDITIVE: 'SELECT_ADDITIVE',
  MACHINE_FORMULA: 'MACHINE_FORMULA',
  SELECTABLE_FORMULA: 'SELECTABLE_FORMULA',
} as const

// interface TheoreticalProgram {
//   programNo: number
//   programName: string
//   startTime: Date
//   endTime: Date
//   duration: number
//   ioValues: {
//     time: Date | string
//     value: number
//     programNo: number
//     commandNo: number
//   }[]
// }
let errors: { code: string, message: string, params?: any }[] = []
/**
 * Programın teorik süresini hesaplar.
 * @param program - Program
 * @param machine - Machine
 * @returns {number} Program duration
 */
export function calculateProgramTheoreticalTemperature(startTime: string | Date, initialTemp: number, programs: Program[], machine: Machine) {
  let time = new Date(startTime)
  errors = [] as any
  // const ioValues: { time: Date | string, value: number, programNo: number, commandNo: number }[] = []
  const context: CalculationContext = {
    temperature: initialTemp,
    machine,
  }
  const theoreticalPrograms: Array<TheoreticalProgram> = []
  programs.forEach((program, index) => {
    theoreticalPrograms.push({
      programNo: program.programNo,
      programName: program.name,
      startTime: time,
      endTime: time,
      duration: 0,
      ioValues: [],
    })
    for (const step of program.steps) {
      const programStep = _calculateProgramStepDuration(step, context)
      time = new Date(time.getTime() + programStep.duration * 1000)
      theoreticalPrograms[index].duration += programStep.duration
      theoreticalPrograms[index].ioValues.push({ time, value: programStep.temperature, programNo: program.programNo, commandNo: step.mainCommand.commandNo })
      if (programStep.delay) {
        theoreticalPrograms[index].duration += programStep.delay
        time = new Date(time.getTime() + programStep.delay * 1000)
        theoreticalPrograms[index].ioValues.push({ time, value: programStep.temperature, programNo: program.programNo, commandNo: step.mainCommand.commandNo })
      }
    }
    theoreticalPrograms[index].endTime = time
  })
  return { theoreticalPrograms, errors }
}
/**
 * Lütfen bu sayafadaki herhangi bir değişiklikten önce @egeiliklier 'e danışınız
 */
export function calculateTheoreticalCommands(startTime: string | Date, initialTemp: number, programs: Program[], machine: Machine) {
  let time = new Date(startTime)
  let prevTime = new Date(startTime)
  const commands = [] as BatchCommand[]
  const context: CalculationContext = {
    temperature: initialTemp,
    machine,
  }
  let stepIndex = 0
  programs.forEach((program) => {
    program.steps.forEach((step) => {
      const programStep = _calculateProgramStepDuration(step, context)
      time = new Date(time.getTime() + programStep.duration * 1000)
      if (programStep.delay) {
        time = new Date(time.getTime() + programStep.delay * 1000)
      }
      commands.push({
        commandNo: step.mainCommand.commandNo,
        startTime: prevTime,
        endTime: time,
        stepNo: stepIndex,
        parallelStepNo: 0,
        programIndex: -1,
        programNo: program.programNo,
        programName: program.name,
      })

      step.parallelCommands.forEach((parallel, parallelIndex) => {
        commands.push({
          commandNo: parallel.commandNo,
          startTime: prevTime,
          endTime: time,
          stepNo: stepIndex,
          parallelStepNo: parallelIndex + 1,
          programIndex: -1,
          programNo: program.programNo,
          programName: program.name,
        })
      })

      stepIndex++
      prevTime = time
    })
  })

  return commands
}

function _calculateProgramStepDuration(step: ProgramStep, context: CalculationContext): { duration: number, delay?: number, temperature: number } {
  let duration = 0
  let delay = 0
  const commandNo = step.mainCommand.commandNo
  if (commandNo) {
    const machineCommand = getCommand(context.machine, commandNo)
    if (!machineCommand)
      return { duration: 0, temperature: context.temperature }

    duration += calculateFormula(step, commandNo, machineCommand.x, context.machine)

    const a = calculateFormula(step, commandNo, machineCommand.a, context.machine) || 0

    const maxA = calculateFormula(step, commandNo, machineCommand.maxA, context.machine) || 0

    let minA = Math.min(a, maxA) || 0
    if (minA === 0)
      minA = Math.max(a, maxA)

    delay = calculateFormula(step, commandNo, machineCommand.b, context.machine) || 0

    if (machineCommand.isTemperature) {
      const temperature = calculateFormula(step, commandNo, machineCommand.y, context.machine) || 0
      const lastTemperature = context.temperature
      if (temperature)
        context.temperature = temperature

      if (minA)
        duration += ((Math.abs(temperature - lastTemperature) / minA) * 60)
    }
  }
  return { duration, delay, temperature: context.temperature }
}

const { Grammar, Parser } = nearley
const parseCache = new Map<string, any>()

export function calculateFormula(step: ProgramStep, commandNo: number, formula: string, machine: Machine): number {
  if (!formula)
    return 0
  let tree = parseCache.get(formula)
  if (!tree) {
    const parser = new Parser(Grammar.fromCompiled(grammar))
    parser.feed(formula)
    tree = parser.results[0]
    parseCache.set(formula, tree)
  }
  return calculateTreeNode(step, commandNo, tree, machine)
}

type TreeNode = OperatorNode | NumberNode | VariableNode

interface OperatorNode {
  type: 'operator'
  left: TreeNode
  operator: '+' | '-' | '*' | '/'
  right: TreeNode
}

interface NumberNode {
  type: 'number'
  value: number
}

interface VariableNode {
  type: 'variable'
  value: string
}

function getCommand(machine: Machine, commandNo: number): MachineCommand | undefined {
  return machine.commands.find(cmd => cmd.commandNo === commandNo)
}

function calculateTreeNode(step: ProgramStep, commandNo: number, node: TreeNode, machine: Machine): number {
  const getMachineConstant = (paramName: string): MachineConstant | undefined => {
    return machine.constants.find(mc => mc.name === paramName)
  }

  const getBatchParameter = (paramName: string): MachineBatchParameter | undefined => {
    return machine.batchParameters.find(bp => bp.name === paramName)
  }

  const getCommandFormula = (formulaId: number): MachineCommandFormula | undefined => {
    return machine.commandFormulas.find(f => f.id === formulaId)
  }

  /**
   * Belirtilen komut numarasına sahip komutun parametre bilgisini getirir
   * @param commandNo - Komut numarası
   * @param paramName - Parametre adı
   * @returns {CommandParameter | undefined} - Komut parametresi
   */
  const getCommandParameter = (commandNo: number, paramName: string): MachineCommandParameter | undefined => {
    return getCommand(machine, commandNo)?.parameters.find(p => p.name === paramName)
  }

  const warnAndReturn = (...data: any[]) => {
    console.warn(...data)
    return 0
  }

  switch (node.type) {
    case 'number':
      return node.value

    case 'variable': {
      // başlatma parametresi
      const batchParameter = getBatchParameter(node.value)
      if (batchParameter) {
        return batchParameter.defaultValue || 0
      }
      // makine sabiti
      const machineConst = getMachineConstant(node.value)
      if (machineConst) {
        return machineConst.value
      }

      // komut parametresi mi?
      const commandParameter = getCommandParameter(commandNo, node.value)

      if (commandParameter) {
        // Number
        if (commandParameter.type === ParameterType.NUMBER) {
          if (!commandParameter.containsVariable) {
            return commandParameter.useDefault
              ? Number(commandParameter.value)
              : Number(step.mainCommand.parameters.find(p => p.index === commandParameter.index)?.value)
          } else {
            return calculateFormula(step, commandNo, commandParameter.value, machine)
          }

        // Selectable formula
        } else if (commandParameter.type === ParameterType.SELECTABLE_FORMULA) {
          const formulaId = step.mainCommand.parameters.find(p => p.index === commandParameter.index)?.value
          if (!formulaId) {
            return warnAndReturn(`No parameter defined with index ${commandParameter.index}`, {
              definition: commandParameter,
              availableParameters: step.mainCommand.parameters,
            })
          }
          const commandFormula = getCommandFormula(formulaId)
          if (!commandFormula) {
            return warnAndReturn(`Formula used for parameter ${node.value} is not found`, {
              machine,
              requestedFormalaId: formulaId,
            })
          }

          return calculateFormula(step, commandNo, commandFormula.formula, machine)

        // Machine formula
        } else if (commandParameter.type === ParameterType.MACHINE_FORMULA) {
          return calculateFormula(step, commandNo, commandParameter.value, machine)
        }
      } else {
        errors.push({
          code: 'VARIABLE_NOT_FOUND',
          message: `Variable ${node.value} not defined. Command No: ${commandNo}`,
          params: { value: node.value, commandNo },
        })
      }

      return 0
    }

    case 'operator': {
      const leftValue = calculateTreeNode(step, commandNo, node.left, machine)
      const rightValue = calculateTreeNode(step, commandNo, node.right, machine)

      switch (node.operator) {
        case '+':
          return leftValue + rightValue
        case '-':
          return leftValue - rightValue
        case '*':
          return leftValue * rightValue
        case '/':
          if ((rightValue) === 0) {
            errors.push({ code: 'DIVISION_BY_ZERO', message: 'Division by zero' })
            return 0
          }
          return leftValue / rightValue
        default:
          errors.push({ code: 'UNKNOWN_OPERATOR', message: `Unknown operator: ${node.operator}`, params: { operator: node.operator } })
          return 0
      }
    }

    default:
      errors.push({ code: 'UNKNOWN_NODE_TYPE', message: `Unknown node type: ${(node as any).type}`, params: { type: (node as any).type } })
      return 0
  }
}
