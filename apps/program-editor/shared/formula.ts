import nearley from 'nearley'
// @ts-expect-error TODO: Add shims for nearley files
import grammar from './grammar.ne'
import { ParameterType } from './constants'
import type { BatchParameter, CommandFormula, CommandParameter, Machine, MachineCommand, MachineConstant, Program, ProgramStep } from './types'

interface CalculationContext {
  temperature: number
  machine: Machine
}

/**
 * Programın teorik süresini hesaplar.
 * @param program - Program
 * @param machine - Machine
 * @returns {number} Program duration
 */
export function calculateProgramDuration(program: Program, machine: Machine, initialTemperature: number): number {
  let duration = 0
  const context: CalculationContext = {
    temperature: initialTemperature,
    machine,
  }

  for (const step of program.steps) {
    const stepDuration = _calculateProgramStepDuration(step, context)
    for (const _ of stepDuration) {
      duration += _.duration
    }
  }

  return duration
}

/**
 * Programın her bir adımın noktasını hesaplar.
 * @param program - Program
 * @param machine - Makine
 * @param initialTemperature - Baslangıc sicakligi
 * @returns {number} Teorik sure
 */
export function calculateProgramDurationPoint(program: Program, machine: Machine, initialTemperature: number) {
  const tempData: number[] = [initialTemperature]
  const timeData: number[] = [0]
  const gradientData: number[] = [0]
  const pointStyles: string[] = ['circle']
  const pointBackgroundColors: string[] = ['green']
  const dataPoints: { x: number, y: number }[] = [{ x: 0, y: initialTemperature }]
  const stepInfo: { step: number, commandNo: number, commandName: string }[] = []

  for (let i = 0; i < program.steps.length; i++) {
    const points = calculateProgramStepDuration(
      program,
      machine,
      initialTemperature,
      i,
    )
    for (const point of points) {
      const prevTime = timeData[timeData.length - 1]
      const currentTime = prevTime + point.duration

      tempData.push(point.temperature)
      timeData.push(currentTime)
      gradientData.push((point.temperature - tempData[tempData.length - 1]) / point.duration)

      const commandNo = program.steps[i].mainCommand.commandNo!
      const machineCommand = machine.commands.get(commandNo)!
      stepInfo.push({ step: i + 1, commandNo, commandName: machineCommand.name })

      dataPoints.push({ x: currentTime, y: point.temperature })

      if (machineCommand.isUnload) {
        pointStyles.push('rectRot')
        pointBackgroundColors.push('red')
      } else {
        pointStyles.push('circle')
        pointBackgroundColors.push('green')
      }
    }
  }
  return { tempData, timeData, pointStyles, pointBackgroundColors, dataPoints, stepInfo, gradientData }
}

/**
 * Programın her bir adımın teorik süresini hesaplar.
 * @param program - Program
 * @param machine - Makine
 * @param initialTemperature - Baslangıc sicakligi
 * @param index - Programın kacinci adımı
 * @returns {number} Teorik sure
 */
export function calculateProgramStepDuration(program: Program, machine: Machine, initialTemperature: number, index: number): { duration: number, temperature: number }[] {
  const context: CalculationContext = {
    temperature: initialTemperature,
    machine,
  }
  for (let i = 0; i < index; i++) {
    const step = program.steps[i]
    const commandNo = step.mainCommand.commandNo
    if (commandNo) {
      const machineCommand = context.machine.commands.get(commandNo)
      if (machineCommand?.isTemperature) {
        const temperature = calculateFormula(step, commandNo, machineCommand.y, context.machine)
        if (temperature)
          context.temperature = temperature
      }
    }
  }

  return _calculateProgramStepDuration(program.steps[index], context)
}

function _calculateProgramStepDuration(step: ProgramStep, context: CalculationContext): { duration: number, temperature: number }[] {
  const stepInfo = [{ duration: 0, temperature: context.temperature }]
  let duration = 0

  const commandNo = step.mainCommand.commandNo
  if (commandNo) {
    const machineCommand = context.machine.commands.get(commandNo)
    if (!machineCommand)
      return stepInfo

    duration += calculateFormula(step, commandNo, machineCommand.x, context.machine)

    const a = calculateFormula(step, commandNo, machineCommand.a, context.machine) || 0

    const maxA = calculateFormula(step, commandNo, machineCommand.maxA, context.machine) || 0

    let minA = Math.min(a, maxA) || 0
    if (minA === 0)
      minA = Math.max(a, maxA)

    const b = calculateFormula(step, commandNo, machineCommand.b, context.machine) || 0

    if (machineCommand.isTemperature) {
      const temperature = calculateFormula(step, commandNo, machineCommand.y, context.machine) || 0
      const lastTemperature = context.temperature
      if (temperature)
        context.temperature = temperature

      if (minA)
        duration += ((Math.abs(temperature - lastTemperature) / minA) * 60)
    }

    if (b)
      stepInfo.push({ duration: Math.round(b), temperature: context.temperature })
  }

  stepInfo[0].duration = Math.round(duration)
  stepInfo[0].temperature = context.temperature

  return stepInfo
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

function calculateTreeNode(step: ProgramStep, commandNo: number, node: TreeNode, machine: Machine): number {
  const getMachineConstant = (paramName: string): MachineConstant | undefined => {
    return machine.constants.find(mc => mc.paramString === paramName)
  }

  const getBatchParameter = (paramName: string): BatchParameter | undefined => {
    return machine.batchParameters.find(bp => bp.paramString === paramName)
  }

  const getCommandFormula = (formulaId: number): CommandFormula | undefined => {
    return machine.commandFormulas.find(f => f.formulaId === formulaId)
  }

  /**
   * Belirtilen komut numarasına sahip komutun parametre bilgisini getirir
   * @param commandNo - Komut numarası
   * @param paramName - Parametre adı
   * @returns {CommandParameter | undefined} - Komut parametresi
   */
  const getCommandParameter = (commandNo: number, paramName: string): CommandParameter | undefined => {
    return machine.commands.get(commandNo)?.parameters.find(p => p.name === paramName)
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
        return batchParameter.defaultValue
      }
      // makine sabiti
      const machineConst = getMachineConstant(node.value)
      if (machineConst) {
        return machineConst.currentValue
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
      }

      throw new Error(`Variable ${node.value} not defined. Command No: ${commandNo}`)
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
            throw new Error('Division by zero')
          }
          return leftValue / rightValue
        default:
          throw new Error(`Unknown operator: ${node.operator}`)
      }
    }

    default:
      throw new Error(`Unknown node type: ${(node as any).type}`)
  }
}
