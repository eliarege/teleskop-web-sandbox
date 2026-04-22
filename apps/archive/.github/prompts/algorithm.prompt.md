---
agent: agent
---
I need to implement `fetchActualStepsWithTheoreticalValuesAtTime` using functions above.

Flow of function is:

- First it fetches batch, continues if exists
- Fetch machine command definitions after learning the machineId that runs the batch
- Fetch programs that is supposed to run in batch theoretically
- Fetch steps that has already run in batch
- Fetch step changes. Step changes are when new step is added or removed.
- Fetch parameter changes and selection changes. Every change data stores when change happened, at what step, at what command with its new value and old value.
- Fetch the step commands that are actively running at given timestamp and determine what parameters are they running with theoretically and in actuality.

Context:

- Programs are made of steps
- Steps have a main command and multiple parallel commands. In theorical programs, every parallel command should start as the same time with main command but sometimes they might overflow to other steps.
- Commands have parameters and IO selections. Parameters are float based values. IO's are checkbox based values. Each checkbox represents two values; IO Type and IO Physical ID. If a pair checked, they are included in selections array. Available options can be acquired from that commands definition object.
- Parameter index or IO List entry index are not array indexes. Assume they are unique in the array they are located in.
- Parameter and IO changes are not just individual changes. When a new step is added, the parameters used in that step are also pushed to parameter and IO changes.

- There is caveat with the indexing of step numbers. For example, if a step is deleted while at a certain point of time while batch was running, the steps after that time have their indexes reduced by 1. As an example:

  - A batch is 30 minutes long
  - It has 10 steps (Combination of programs)
  - At 10 minute mark, while 3rd step was running, we removed 5th step.
  - Before the 10 minute mark, all parameter changes that references the steps beyond the 5th are as expected.
  - But after the 10th minute mark, all parameter changes that references the steps beyond the 5th step are now reduced by 1.

- This also applied to step additions where all step indexes are increased by one.
- There is possibility of step skips. These are not stored anywhere and can only be understood if there is a stepNo gap.


Assumptions:

- Assume that ActualStep, StepChange, ParamterChange, IoSelectionChange arrays are in order by (stepNo, parallelIndex).
- Assume all other fetch functions works as expected and returns valid data.
---

Implement the algorithm that correctly returns the `Result` object.

You can write the code in TypeScript, write it in workspace root with file name `algorithm.ts`.

The signature of all interfaces and functions are as follows:

```ts
interface Batch {
  machineId: number
  // Program no's that is supposed to run in Batch
  programList: number[]
  startTime: Date
  endTime: Date | null
  cancelTime: Date | null
}

interface MachineCommand {
  machineId: number
  commandNo: number
  parameters: MachineCommandParameter[]
  ioList: MachineCommandIO[]
}

interface MachineCommandParameter {
  // Not index in the parameters, but the parameter index defined by the command
  index: number
  name: string
}

interface MachineCommandIO {
  index: number
  name: string
  options: {
    type: number
    physicalId: number
  }[]
}

interface TheoreticalProgram {
  // Index of step in program
  machineId: number
  programNo: number
  steps: ProgramStep[]
}

interface ProgramStep {
  stepNo: number
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}

interface ProgramStepCommand {
  commandNo: number
  parameters: Parameter[]
  ioList: IoListEntry[]
}

interface Parameter {
  // Not index in the array, but the parameter index defined by the command
  index: number
  value: number
}

interface IoListEntry {
  // Not index in the array, but the IO index defined by the command
  index: number
  selections: [number, number][]
}

interface ActualStepCommand {
  programNo: number
  stepNo: number
  // If 0, its a main command; If greater than 0, its a parallel command with that (index - 1)
  parallelIndex: number
  commandNo: number
  startTime: Date
  endTime: Date | null
}

interface StepChange {
  stepNo: number
  parallelIndex: number
  commandNo: number
  action: 'added' | 'removed'
}

interface ParameterChange {
  programNo: number
  stepNo: number
  // If 0, its a main command; If greater than 0, its a parallel command with that (index - 1)
  parameterIndex: number
  commandNo: number
  oldValue: string
  newValue: string
  changeDate: Date
}

interface IoSelectionChange {
  programNo: number
  stepNo: number
  // If 0, change happens in the main command; If greater than 0, its happens to a parallel command with that (index - 1)
  parameterIndex: number
  commandNo: number
  ioIndex: number
  ioSelectIndex: number
  newValue: boolean
  changeDate: Date
}

interface Result {
  mainCommand: ResultCommand
  parallelCommands: ResultCommand[]
}

interface ResultCommand {
  commandNo: number
  parameters: {
    index: number
    actualValue: number
    theoreticalValue: number
  }[]
  ioList: {
    index: number
    actualSelections: [number, number][]
    theoreticalSelections: [number, number][]
  }[]
}

// Fetch finished or ongoing batch
function fetchBatch(batch: number): Promise<Batch> {}
// Fetch commands of machine
function fetchMachineCommands(machineId: number): Promise<MachineCommand[]>
// Fetch program
function fetchTheoreticalProgram(machineId: number, programNo: number): Promise<Program> {}
// Fetch running or finished steps (Actual)
function fetchActualSteps(batch: number): Promise<ActualStepCommand[]> {}
// Fetch running/finished steps that was running at given timestamp
function fetchActualStepsAtTime(batch: number, time: Date): Promise<ActualStepCommand[]>
// Fetch all step insertions/deletions while batch was/is running
function fetchBatchStepChanges(batchKey: number): Promise<StepChange[]>
// Fetch all batch parameter changes applied while batch was/is running
function fetchBatchParameterChanges(batchKey: number): Promise<ParameterChange[]> {}
// Fetch all batch IO selection changes applied while batch was/is running
function fetchBatchIoSelectionChanges(batchKey: number): Promise<IoSelectionChange[]> {}

// I need to implement this function
function fetchActualStepsWithTheoreticalValuesAtTime(batchKey: number, time: Date): Promise<Result>
```
