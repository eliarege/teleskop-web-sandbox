// $machine.$program
export interface ParsedProgramKey {
  type: 'program'
  machineId: number
  programNo: number
}

// $machine.$program.$step
export interface ParsedProgramStepKey {
  type: 'program_step'
  machineId: number
  programNo: number
  stepIndex: number
}

// $machine.$program.$step.$parallel
export interface ParsedProgramStepCommandKey {
  type: 'program_step_command'
  machineId: number
  programNo: number
  stepIndex: number
  parallelIndex: number
}

// $machine.$program.$step.$parallel.pr.$index
export interface ParsedProgramStepCommandParameterKey {
  type: 'program_step_command_parameter'
  machineId: number
  programNo: number
  stepIndex: number
  parallelIndex: number
  parameterIndex: number
}

// $machine.$program.$step.$parallel.io.$index
export interface ParsedProgramStepCommandIoKey {
  type: 'program_step_command_io'
  machineId: number
  programNo: number
  stepIndex: number
  parallelIndex: number
  ioIndex: number
}
