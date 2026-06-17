import nearley from 'nearley'
import { isDef } from '@teleskop/utils'
import grammar from './grammar.ne'
import { ParameterType } from './constants'
import type { BatchParameter, CommandFormula, CommandParameter, Machine, MachineConstant, Program, ProgramStep } from './types'

interface CalculationContext {
  temperature: number
  machine: Machine
}

interface StepResult {
  errors: string[][]
  duration: number
  temperature: number
}

/**
 * Programın teorik süresini hesaplar.
 * @param program - Program
 * @param machine - Machine
 * @returns {number} Program duration
 */
export function calculateProgramDuration(program: Program, machine: Machine, initialTemperature: number):
{ errors: string[][], duration: number, stepDuration: StepResult[] } {
  const context: CalculationContext = {
    temperature: initialTemperature,
    machine,
  }

  const errors: string[][] = []
  const stepDuration: StepResult[] = []
  let totalDuration = 0

  for (const step of program.steps) {
    const phases = calculateStepPhases(step, context)

    for (const phase of phases) {
      stepDuration.push(phase)
      if (phase.errors && phase.errors.length > 0) {
        errors.push(...phase.errors)
      }
      totalDuration += phase.duration
    }
  }

  return {
    errors,
    duration: Math.round(totalDuration),
    stepDuration,
  }
}

/**
 * Programın her bir adımın grafikteki noktasının teorik değerini hesaplar.
 * @param machine - Makine
 * @param program - Program
 * @param initialTemperature - Baslangıc sicakligi
 */
export function calculateProgramDurationPoint(machine: Machine, program: Program, initialTemperature: number): {
  tempData: number[]
  timeData: number[]
  pointStyles: string[]
  pointBackgroundColors: string[]
  dataPoints: { x: number, y: number }[]
  stepInfo: { step: number, commandNo: number, commandName: string }[]
  gradientData: number[]
} {
  const tempData: number[] = [initialTemperature]
  const timeData: number[] = [0]
  const gradientData: number[] = [0]
  const pointStyles: string[] = ['circle']
  const pointBackgroundColors: string[] = ['green']
  const dataPoints: { x: number, y: number }[] = [{ x: 0, y: initialTemperature }]
  const stepInfo: { step: number, commandNo: number, commandName: string }[] = []

  const context: CalculationContext = {
    temperature: initialTemperature,
    machine,
  }

  for (let i = 0; i < program.steps.length; i++) {
    const step = program.steps[i]
    const phases = calculateStepPhases(step, context)

    if (!phases || phases.length === 0)
      continue

    const commandNo = step.mainCommand.commandNo!
    const machineCommand = machine.commands.get(commandNo)!

    // Bir adımın içindeki fazları (Örn: Isınma fazı ve Bekleme Fazı) grafiğe ayrı ayrı işliyoruz.
    for (const phase of phases) {
      const prevTime = timeData[timeData.length - 1]
      const prevTemp = tempData[tempData.length - 1]

      const currentTime = prevTime + phase.duration
      const currentTemp = phase.temperature

      const gradient = phase.duration > 0
        ? (currentTemp - prevTemp) / phase.duration
        : 0

      tempData.push(currentTemp)
      timeData.push(currentTime)
      gradientData.push(gradient)

      stepInfo.push({ step: i + 1, commandNo, commandName: machineCommand.name })
      dataPoints.push({ x: currentTime, y: currentTemp })

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
 * Bir program adımının süre ve sıcaklık fazlarını hesaplar. (Eski _calculateProgramStepDuration)
 */
function calculateStepPhases(step: ProgramStep, context: CalculationContext): StepResult[] {
  let duration = 0
  const phases: StepResult[] = [{ errors: [], duration: 0, temperature: context.temperature }]

  const commandNo = step.mainCommand.commandNo
  if (!isDef(commandNo)) {
    phases[0].errors.push(['COMMAND_NOT_DEFINED', String(commandNo)])
    return phases
  }

  const machineCommand = context.machine.commands.get(commandNo)
  if (!machineCommand) {
    phases[0].errors.push(['MACHINE_COMMAND_NOT_FOUND', String(commandNo)])
    return phases
  }

  // x formülü hesaplama (Standart süre)
  const x = calculateFormula(step, commandNo, machineCommand.x, context.machine)
  if (!isDef(x))
    phases[0].errors.push(['FORMULA_X_FAILED', String(commandNo)])
  duration += x || 0

  // a ve maxA formülü hesaplama (Sıcaklık Gradient Oranı)
  const a = calculateFormula(step, commandNo, machineCommand.a, context.machine)
  if (!isDef(a))
    phases[0].errors.push(['FORMULA_A_FAILED', String(commandNo)])

  const maxA = calculateFormula(step, commandNo, machineCommand.maxA, context.machine)
  if (!isDef(maxA))
    phases[0].errors.push(['FORMULA_MAXA_FAILED', String(commandNo)])

  let minA = Math.min(a, maxA) || 0
  if (minA === 0)
    minA = Math.max(a, maxA)

  // Sıcaklık İşlemi (Rampa Fazı)
  if (machineCommand.isTemperature) {
    const calculatedTemp = calculateFormula(step, commandNo, machineCommand.y, context.machine)
    if (!isDef(calculatedTemp))
      phases[0].errors.push(['FORMULA_Y_FAILED', String(commandNo)])

    const lastTemperature = context.temperature
    if (calculatedTemp)
      context.temperature = calculatedTemp

    if (minA) {
      duration += ((Math.abs(calculatedTemp - lastTemperature) / minA) * 60)
    }
  }

  // İlk fazı (Isınma / Temel süre) güncelle
  phases[0].duration = Math.round(duration)
  phases[0].temperature = context.temperature

  // b formülü hesaplama (Bekleme / İkinci Faz)
  const b = calculateFormula(step, commandNo, machineCommand.b, context.machine)
  if (!isDef(b))
    phases[0].errors.push(['FORMULA_B_FAILED', String(commandNo)])

  // Eğer b değeri varsa, bunu yeni bir faz (bekleme noktası) olarak diziye ekle
  if (b && b > 0) {
    phases.push({
      errors: [],
      duration: Math.round(b),
      temperature: context.temperature, // Beklemede sıcaklık değişmez
    })
  }

  return phases
}

// ============================================================================
// FORMULA PARSER BÖLÜMÜ
// ============================================================================

const { Grammar, Parser } = nearley
const parseCache = new Map<string, any>()

/**
 * Bir adımın formulu hesaplar.
 */
export function calculateFormula(step: ProgramStep, commandNo: number, formula: string, machine: Machine): number {
  if (!formula)
    return 0

  try {
    let tree = parseCache.get(formula)
    if (!tree) {
      const parser = new Parser(Grammar.fromCompiled(grammar))
      parser.feed(formula)
      tree = parser.results[0]
      parseCache.set(formula, tree)
    }
    return calculateTreeNode(step, commandNo, tree, machine)
  } catch (error) {
    console.warn(`Failed to process formula: "${formula}"`, {
      error: error instanceof Error ? error.message : String(error),
      commandNo,
      step,
    })
    return 0
  }
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
      const batchParameter = getBatchParameter(node.value)
      if (batchParameter)
        return batchParameter.defaultValue

      const machineConst = getMachineConstant(node.value)
      if (machineConst)
        return machineConst.currentValue

      const commandParameter = getCommandParameter(commandNo, node.value)

      if (commandParameter) {
        if (commandParameter.type === ParameterType.NUMBER) {
          if (!commandParameter.containsVariable) {
            return commandParameter.useDefault
              ? Number(commandParameter.value)
              : Number(step.mainCommand.parameters.find(p => p.index === commandParameter.index)?.value)
          } else {
            return calculateFormula(step, commandNo, commandParameter.value, machine)
          }
        } else if (commandParameter.type === ParameterType.SELECTABLE_FORMULA) {
          const formula = step.mainCommand.parameters.find(p => p.index === commandParameter.index)
          if (!formula?.value) {
            return warnAndReturn(`No parameter defined with index ${commandParameter.index}`, {
              definition: commandParameter,
              availableParameters: step.mainCommand.parameters,
            })
          }
          const commandFormula = getCommandFormula(Number(formula.value))
          if (!commandFormula) {
            return warnAndReturn(`Formula used for parameter ${node.value} is not found`, {
              machine,
              requestedFormalaId: formula.value,
            })
          }

          const formulaValue = getCommandParameter(commandNo, commandFormula.formula)?.value
          if (formulaValue) {
            return calculateFormula(step, commandNo, formulaValue, machine)
          } else {
            return calculateFormula(step, commandNo, commandFormula.formula, machine)
          }
        } else if (commandParameter.type === ParameterType.MACHINE_FORMULA) {
          return calculateFormula(step, commandNo, commandParameter.value, machine)
        } else if (commandParameter.type === ParameterType.CHECKBOX) {
          return Number(commandParameter.value)
        }
      }

      throw new Error(`Variable ${node.value} not defined. Command No: ${commandNo}`)
    }

    case 'operator': {
      const leftValue = calculateTreeNode(step, commandNo, node.left, machine)
      const rightValue = calculateTreeNode(step, commandNo, node.right, machine)

      if (Number.isNaN(leftValue) || Number.isNaN(rightValue)) {
        return 0
      }

      switch (node.operator) {
        case '+': return leftValue + rightValue
        case '-': return leftValue - rightValue
        case '*': return leftValue * rightValue
        case '/':
          if ((rightValue) === 0)
            throw new Error('Division by zero')
          return leftValue / rightValue
        default:
          throw new Error(`Unknown operator: ${node.operator}`)
      }
    }

    default:
      throw new Error(`Unknown node type: ${(node as any).type}`)
  }
}
