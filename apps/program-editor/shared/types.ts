import type { QBtnProps } from 'quasar'
import type { CommandEligibility, ParameterTypeValue } from './constants'

export interface ProgramInfo {
  programNo: number
  name: string
  type: number
  updatedAt: Date
  updatedAtTBB: Date | null
  prgState: number
  isChanged: boolean
}

export interface ProgramFilter {
  programNo?: number
  programName?: string
  processType?: ProcessType
  clearOnChange: boolean
}

export interface ProgramTableRow {
  programNo: number
  name: string
  errorCount?: number
  duration: number
  stepCount: number
  type: number
  additionalType: number
  operator: boolean
  updatedAt: Date
  prgState: number
  isChanged: boolean
  totalChemReq: number
  totalDyeReq: number
  manChemReq: number
  autoChemReq: number
  autoDyeReq: number
  manDyeReq: number
  saltReq: number
  genericMat1Req: number
  genericMat2Req: number
  updatedAtTBB: Date
}

export interface ProcessType {
  label: string
  value: number
  description: string
}
export interface MachineInfo {
  id: number
  name: string
  groupId: number
}

export interface MachineGroup {
  groupId: number
  name: string
  type: number
  visible: boolean
  machines: MachineInfo[]
}

export type MachineTbbModel =
  | 'TBB6500'
  | 'TBB7000'
  | 'T7000/T710-PLC'
  | 'T712'
  | 'T7500'
  | 'T7700'
  | 'T7701ex'
  | 'T711ex'
  | 'Tonello'

export interface MachineCommand {
  machineId: number
  commandNo: number
  name: string
  icon: string
  activated: boolean
  adviceList: string
  dontUseList: number[]
  isRunManual: boolean
  commandType: CommandEligibility
  moveParallel: number
  x: string
  y: string
  a: string
  maxA: string
  b: string
  isTemperature: number
  isUnload: number
  parameters: CommandParameter[]
  ioList: CommandIO[]
}

export interface CommandParameter {
  index: number
  name: string
  group: number | null
  editable: boolean
  type: ParameterTypeValue
  format: string
  value: string
  valueIndex: number | null
  minValue: number
  maxValue: number
  containsVariable: boolean
  useDefault: boolean
  useFormula: boolean
  selections: ParameterSelections[]
}

export interface ParameterSelections {
  name: string
  value: number
}

export interface CommandIO {
  index: number
  physicalId: number
  type: number
  selectable: boolean
  name: string
  selections: CommandIOSelection[]
}

export interface CommandIOSelection {
  index: number
  type: number
  name: string
  defaultValue: boolean
  physicalId: number
}

export interface ioItem {
  id: number
  index: number
  commandNo: number
  type: number
  name: string
  programEditing: number
  commandRun: number
}

export interface ProgramHeader {
  programNo: number
  name: string
  duration: number
  stepCount: number
  author: string | null
  comment: string | null
  typeId: number
  additionalTypeId: number
  createdAt: Date | null
  updatedAt: Date | null
  updatedAtTBB: Date | null
  prgState: number | null
  isChanged: boolean | null
  tbbProgramChangedEvent: number | null
  totalChemReq: number
  totalDyeReq: number
  manChemReq: number
  autoChemReq: number
  autoDyeReq: number
  manDyeReq: number
  saltReq: number
  genericMat1Req: number
  genericMat2Req: number
}

export interface ProgramHeaderArchive extends ProgramHeader {
  version: number
}

export interface ProgramHeaderUpdate {
  programNo: number
  name?: string
  typeId?: number
  additionalTypeId?: number | null
  author?: string | null
  comment?: string | null
  isChanged?: boolean | null
  prgState?: number | null
  updatedAt?: Date | null
  tbbProgramChangedEvent?: number | null
}

export interface Program extends ProgramHeader {
  icon: string | null
  programNo: number
  typeName: string
  machineId: number
  steps: ProgramStep[]
}

export interface ProgramStep {
  stepId: number
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}

export interface ProgramStepCommand {
  commandId: number
  commandNo: number
  parameters: ParameterItem[]
  ioList: ioListItem[]
}

export interface ParameterItem {
  value: number | string
  index: number
  optimized: boolean
}

export interface ioListItem {
  ioId: number
  ioIndex: number
  value: [number, number][]
}

export interface StepItem {
  MACHINEID: number
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  COMMANDNO: number
  ISCONDITIONAL: number
  CONDITIONSTR: string
  ERRORS: number
  THEORETICDURATION: number
}

export interface StepArchiveItem {
  MACHINEID: number
  MACHINEPRGVERSIONNO: number
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  COMMANDNO: number
  ISCONDITIONAL: number
  CONDITIONSTR: string
  THEORETICDURATION: number
}

export interface StepParameter {
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  PARAMETERINDEX: number
  MACHINEID: number
  VALUE: string
  CONTAINSVARIABLE: number
  OPTIMIZEDVALUE: string
  ERRORWARNING: number
  OPTIMIZED: number
}

export interface StepArchiveParameter {
  MACHINEID: number
  MACHINEPRGVERSIONNO: number
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  PARAMETERINDEX: number
  VALUE: string
  CONTAINSVARIABLE: number
  ERRORWARNING: number
  OPTIMIZED: number
}

export interface StepInputOutput {
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  IOINDEX: number
  MACHINEID: number
  IOID: number
  IOTYPE: number
  ERRORWARNING: number
}

export interface StepArchiveInputOutput {
  MACHINEID: number
  MACHINEPRGVERSIONNO: number
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  IOINDEX: number
  IOID: number
  IOTYPE: number
}

export interface SelectionList {
  SELECTIONINDEX: number
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  IOINDEX: number
  MACHINEID: number
  SELECTEDIOID: number
  IOTYPE: number
}

export interface SelectionArchiveList {
  MACHINEID: number
  MACHINEPRGVERSIONNO: number
  SELECTIONINDEX: number
  PROGNO: number
  MAINSTEP: number
  PARALELSTEP: number
  IOINDEX: number
  SELECTEDIOID: number
  IOTYPE: number
}

export interface Machine {
  id: number
  name: string
  tbbModel: MachineTbbModel
  commands: Map<number, MachineCommand>
  commandFormulas: CommandFormula[]
  constants: MachineConstant[]
  batchParameters: BatchParameter[]
  treatmentParameters: TreatmentParameter[]
  commandTypes: CommandTypes[]
}

export interface MachineConstant {
  machineParameterId: number
  machineId: number
  paramString: string
  paramLowLimit: number
  paramHighLimit: number
  paramType: number
  selectionList: string
  unitCode: string
  selectionValues: string
  isDeleted: boolean
  tbbChangeTime: string
  changeTime: string
  defaultValue: number
  dmArea: number
  consScreen: number
  consFormat: number
  consUnit: number
  currentValue: number
}

export interface BatchParameter {
  batchParameterId: number
  machineId: number
  paramString: string
  paramLowLimit: number
  paramHighLimit: number
  batchPlanning: number
  batchStart: number
  recipe: string
  defaultValue: number
  parameterType: number
  selectionList: string
  unitCode: string
  selectionValues: string
  isDeleted: boolean
  tbbChangeTime: string
  changeTime: string
  format: string
  parameterId: number
  unitText: string
  paramStringEn: string
  selectionListDefault: string
}

export interface CommandFormula {
  machineId: number
  formulaId: number
  formula: string
  commandNo: number
  commandParameterNo: number
  formulaName: string
}

export interface TreatmentGroup {
  TreatmentGroupNo: number
  TreatmentGroupName: string
  ImportState: number
}

export interface TreatmentParameter {
  paramId: number
  paramName: string
  groupId: number
  commandNo: number
  parameterIndex: number
}

export interface CommandTypes {
  commandType: number
  commandNo: number
}

export interface StepIcon {
  name: string
  label: string
  color: string
}
export interface TreatmentSettings {
  optimizedEnable: boolean
  optimizedLimit: number
}

export interface TeleskopSettings {
  treatmentSettings: TreatmentSettings
  selectedIcons: number
  initialTemperature: number
}

// #region Program Comparison
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
    diff: boolean
    commandNo: number
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

export interface ContextBarButtons extends QBtnProps {
  originalLabel?: string
  shortcut?: string
  tooltip?: string
  visible?: boolean
}

export interface ProgramWriteSettings {
  addParallelCommandsFromPreviousStep: boolean
  confirmAddParallelCommandToSteps: boolean
  removeParallelCommandFromOtherSteps: boolean
  changeParallelCommandParameterInOtherSteps: boolean
  preventParallelUsageForDisabledCommands: boolean
  activeCommandGroups: boolean
}

// #endregion

export interface CreateError {
  stepId: number
  commandId: number
  message: string
  parameterIndex?: number
  IOIndex?: number
}

export interface ProgramWithErrors {
  program: Program
  programError: ProgramError
}

export interface ProgramError {
  machineId: number
  programNo: number
  steps: StepError[]
}

export interface StepError {
  stepId: number
  commands: CommandError[]
}

export interface CommandError {
  commandId: number
  messages: {
    type: string
    commandNo?: number
    parameterIndex?: number
    parameterName?: string
    ioIndex?: number
    ioName?: string
    ioValue?: string
  }[]
}

export interface CopyItem {
  fromMachineId: number
  toMachineId: number
  program: {
    programNo: number
    name: string
    newProgramNo: number | null
  }[]
}

export interface ProgramItem {
  machineId: number
  programNo: number
  name: string
}
