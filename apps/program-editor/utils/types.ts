export interface ProgramVersion {
  programNo: number
  name: string
  version: number
  stepCount: number
  type: string
  changedDate: Date
}
export interface ProgramStepCommandDiff {
  mainCommand: {
    diff: boolean
    commandNo: number
    parameters: CommandParameterDiff[]
  }
  parallelCommands: {
    commandNo: number
    diff: boolean
    parameters: CommandParameterDiff[]
  }[]
}

export interface CommandParameterDiff {
  index: number
  value: any
  diff: boolean
}

export interface ProgramInfoHeader {
  programName: string
  programNo: number
  programVersion: number | null
  stepCount: number
  isValid: boolean
}
