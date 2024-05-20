import type { ParameterItem, Program, ProgramStep, ProgramStepCommand, ioListItem } from '~/shared/types'

export interface EditorCommand {
  execute(): boolean
  undo(): boolean
}

const UNDO_BEFORE_EXECUTE = 'Undo Before Execute'

export class InsertStepCommand implements EditorCommand {
  readonly program: Program
  readonly index: number
  readonly command: ProgramStep

  constructor(program: Program, index: number, command: ProgramStep) {
    this.program = program
    this.index = index
    this.command = command
  }

  execute(): boolean {
    insertStep(this.program, this.index, this.command)
    return true
  }

  undo(): boolean {
    removeStep(this.program, this.index)
    return true
  }
}

export class RemoveStepCommand implements EditorCommand {
  readonly program: Program
  readonly index: number

  private step?: ProgramStep | null

  constructor(program: Program, index: number) {
    this.program = program
    this.index = index
  }

  execute(): boolean {
    this.step = removeStep(this.program, this.index)
    return true
  }

  undo(): boolean {
    if (!this.step)
      throw new Error(UNDO_BEFORE_EXECUTE)

    insertStep(this.program, this.index, this.step)
    return true
  }
}

export class MoveStepCommand implements EditorCommand {
  readonly program: Program
  readonly from: number
  readonly to: number

  constructor(program: Program, from: number, to: number) {
    this.program = program
    this.from = from
    this.to = to
  }

  execute(): boolean {
    moveStep(this.program, this.from, this.to)
    return true
  }

  undo(): boolean {
    moveStep(this.program, this.to, this.from)
    return true
  }
}

export class InsertParallelCommand implements EditorCommand {
  readonly program: Program
  readonly stepIndex: number
  readonly command: ProgramStepCommand

  constructor(program: Program, stepIndex: number, command: ProgramStepCommand) {
    this.program = program
    this.stepIndex = stepIndex
    this.command = command
  }

  execute(): boolean {
    insertParallelCommand(this.program, this.stepIndex, this.command)
    return true
  }

  undo(): boolean {
    removeParallelCommand(this.program, this.stepIndex, this.command)
    return true
  }
}

export class UpdateCommandParameter implements EditorCommand {
  readonly parameter: ParameterItem

  private newValue: any
  private oldValue: any

  constructor(parameter: ParameterItem, value: number) {
    this.parameter = parameter
    if (!parameter)
      throw new Error(`Parameter ${parameter} not found`)
    this.newValue = value
  }

  execute(): boolean {
    if (this.oldValue) {
      if (this.oldValue !== this.parameter.value)
        console.warn(`Parameter ${this.parameter} value ${this.oldValue}`
        + `and new value ${this.newValue} are equal. No action taken.`)
    }
    if (this.parameter.value !== this.newValue) {
      this.oldValue = this.parameter.value
      this.parameter.value = this.newValue
      return true
    } else {
      return false
    }
  }

  undo(): boolean {
    if (this.parameter.value !== this.newValue)
      console.warn(`Parameter ${this.parameter} value ${this.parameter.value}`
      + `and new value ${this.newValue} are equal. No action taken.`)
    if (!this.oldValue)
      throw new Error('Cannot undo before executing thhe command first')
    this.parameter.value = this.oldValue
    return true
  }
}

export class UpdateCommandIOValue implements EditorCommand {
  readonly io: ioListItem

  private newValue: any
  private oldValue: any

  constructor(io: ioListItem, value: [number, number][]) {
    this.io = io
    this.newValue = value
  }

  private isEqualIO(a: [number, number][], b: [number, number][]): boolean {
    if (a.length !== b.length)
      return false

    for (let i = 0; i < a.length; i++) {
      if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1])
        return false
    }
    return true
  }

  private stringify(value: [number, number][]): string {
    return value.map(v => `[${v[0]},${v[1]}]`).join(',')
  }

  execute(): boolean {
    if (this.oldValue) {
      if (!this.isEqualIO(this.io.value, this.oldValue))
        console.warn(`IO value ${this.stringify(this.io.value)}`
        + `and old value ${this.stringify(this.oldValue)} are equal. No action taken.`)
    }
    if (this.io.value !== this.newValue) {
      this.oldValue = this.io.value
      this.io.value = this.newValue
      return true
    } else {
      return false
    }
  }

  undo(): boolean {
    if (!this.isEqualIO(this.io.value, this.newValue))
      console.warn(`IO value ${this.stringify(this.io.value)}`
      + `and new value ${this.stringify(this.newValue)} are equal. No action taken.`)
    if (this.oldValue)
      throw new Error('Cannot undo before executing thhe command first')
    this.io.value = this.oldValue
    return true
  }
}

function insertStep(program: Program, index: number, step: ProgramStep): boolean {
  assertIndex(index, program.steps.length)

  program.steps.splice(index, 0, step)
  return true
}

function removeStep(program: Program, index: number): ProgramStep | undefined {
  assertIndex(index, program.steps.length)

  if (program.steps.length < index || index < 0)
    return undefined
  const [removedStep] = program.steps.splice(index, 1)
  return removedStep
}

function moveStep(program: Program, from: number, to: number) {
  assertIndex(from, program.steps.length)
  assertIndex(to, program.steps.length)

  const [step] = program.steps.splice(from, 1)
  program.steps.splice(to, 0, step)
}

function insertParallelCommand(program: Program, stepIndex: number, command: ProgramStepCommand): void {
  assertIndex(stepIndex, program.steps.length)
  program.steps[stepIndex].parallelCommands.push(command)
}
function removeParallelCommand(program: Program, stepIndex: number, command: ProgramStepCommand): ProgramStepCommand {
  assertIndex(stepIndex, program.steps.length)

  const [removedCommand] = program.steps[stepIndex].parallelCommands.splice(program.steps[stepIndex].parallelCommands.indexOf(command), 1)
  return removedCommand
}

function assertIndex(index: number, max: number): void {
  if (index < 0 && index > max) {
    throw new Error(`Invalid index: ${index}`)
  }
}
