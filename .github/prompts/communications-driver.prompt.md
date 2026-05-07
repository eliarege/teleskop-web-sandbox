---
name: communications-driver
description: Implementation of communications driver
---

I need to implement a communications driver with various machine types. For now, we will only support Tonello developed machines. Registered machines is fetched from `MachineRepository`. The machines we are going to listen to will be determined by `inUse` and `useInTeleskop` props. Both of these values must be `true` for a machine for communication driver to listen to it. And for a machine to be Tonello machine, `tbbModel` value must be `Tonello`.

A service should listen to active machines in a configured interval. When it detects a machine is added or removed, it should respectively start and stop listening to those machines. You can add methods to repository you deem to necessary, for example for `MachineRepository`, there is a lacking `findInUse` function (or another name). Communication drivers job is to fetch events generated my machines and record what has taken in place. Sometimes, machines may generate events that require communication driver to take the initiative for that machine to continue working. For example, a machine may need a chemical to proceed to next stage of a batch. Machine will generate a event, communication driver will learn of it and send the requested chemical to Dispensing manager stystem. It will wait for dispensing manager system to respond and after its response, it should the response to correct machine via `TonelloApi`. All of the details will be explained in later sections.

## Impotant Data

- MachineStatusRepository
- BatchDataRepository


## Events

Events created by machine is fetched by `fetchEvents` function in `TonelloApi`. Each event has a date and a index. Index is reset at the start of each day. `fetchEvents` works by passing a relative date and index. It will fetch all events that has happened since that day and index. For example, if today is `2026-04-04` and the last event we fetched from a machine was at `2026-04-02` and its ID was `200`, we will send the exact values to `fetchEvents` function and it will return all events start from that day starting from `201`, and all the remaining events from `2026-04-03` and `2026-04-04`. Events should be fetched configured intervals and processed in order.

Things I have in mind are we should avoid writes to database for every type of action. Should store state in memory as long as possible and commit them in batches. Should each fetched event batch be a single commit? Probably. Maybe we need some kind of coordinator in environments where are lots of machines. Last event id and date are known via `lastEventId` and `lastEventDate` columns on `MachineStatus`. Other `lastEvent`-prefixed columns on `MachineStatus` (e.g. `lastReceivedEventId`, `lastReceivedEventDate`, `lastEventProcessId`, `lastEventProcessDate`) are not used by the communications driver and should be ignored.

> NOTE: There will be many unused properties due to Tonello machines not supporting each of them. AVOID inferring properties not mentioned here.

Event types:

- ChemicalRequestEvent
- BatchStartEvent
- BatchEndEvent
- BatchCancelledEvent
- CommandStartEvent
- CommandFinishEvent
- IoValueChangedEvent


From the events, we can get an idea of what we need to track in machines.

- Lifetime of batches
- Lifetime of alarms
- Lifetime of commands
- IO Value changes
- Chemical requests by machine

There is also concept of stops. These are the sections between batches. The machine idle times. We should also track this state because these will be inserted to a `BatchStopRepository`.
Normally, we have to set reasons of why the machine is stopped (sent by machine itself when batch has ended) but Tonnelo machines do not support this feature so we will had a default placeholder value.

## Digital Value States

We need to store digital input and output states. At start of each batch, Tonello machine will send all IO values back to back as `IOValueChanged` event with same `datetime` value. This is used to reset the state of digital values. We do not need to store the state of analog values. I will write the insert to repository logic on `IOValueChanged` section.

## Event Types

I will go over each event one by one, and I will explain what should happen for each of them:

### BatchStartEvent

This event signifies the beginning of a batch. Almost all events should be ignored if there is no active batch running. (Maybe except alarms, not sure yet) I already created the types necessary for events but I will write it down for reference. Batch start event is like following:

```ts
interface TonelloBatchStartEvent {
  // Next 3 are standard properties that are present in each event
  id: value
  eventValue: number
  datetime: string
  batchCode: string
  operator: number
  type: number
  weight: number
}
```

Steps:
1. We need check if this job order was planned via `BatchPlanRepository`. `batchCode` and `jobOrder` are synonyms. Via this, we will learn which machine this job order was planned for. Null if not planned.
2. We need to create a batch with `BatchDataInsert` type.
I will enter the required props and how they are set based on the interface.
```ts
const batch = {
  // Can be empty
  batchReference: '',
  // Machine session should be aware of its ID
  machineId: machineSession.machineId,
  // Can fetch from machineRepository
  machineCode: machineRepository.findNameById(machineSession.machineId).name,
  jobOrder: event.batchCode,
  startTime: event.datetime,
  programCount: 0,
  programNoList: '',
  isCorrection: false,
  archived: false,
  // The planned batch we fetched from step 1
  plannedMachineId: plannedBatch?.plannedMachine
  fabricWeight: event.weight,
  theoreticalDuration: 0,
  operatorCode: event.operator,
  planKey: plannedBatch?.planKey ?? -1,
  operatorName: 'Operator',
  customerName: 'Customer',
  partyNumber: 'Party'
}
```
3. NOT SURE IF THIS SHOULD HAPPEN HERE. If there is a batch in this machine that hasnt been marked as completed before this one, we need to set its `cancelTime` to start of this event.
4. We need to set following status values (based on `MachineStatusUpdate`)

```ts
status.runningJobOrder = event.batchCode
status.runningJobOrderStartTime = new Date(event.datetime)
// This can only be acquired after batch has been inserted, so probably we should set this at the very end when everything is going to be committed.
status.runningBatchKey = batch.batchKey
status.runningBatchStatus = BatchStatus.Running
// Runninog program values will be set after we infer the first event object
status.runningProgramNo = 0
status.runningProgramName = ''
status.runningProgramNoList = ''
status.runningStepNo = -1
status.runningCommandNo = 0
status.runningCommandName = ''
status.runningOperatorNo = event.operator
status.runningOperatorName = 'Operator'
status.runningTheoreticalTime = batch.theoreticalDuration
status.runningAlarmNo = 0
status.runningAlarmName: ''
status.stopReason = ''
status.stopReasonDateTime = null
status.manualReason = ''
status.manualReasonDateTime = null
status.lastEventId = event.id
status.lastEventDate = extractDateString(event.datetime)
```
5. We need to tell planning board API (configured URL) to remove the planned batch from queue. Should set `PUT` request to `/planning_board/unplan` with JSON body `{ planKey }`. Should create a `PlanningBoardService` that communicates with this API. `ofetch` should be used for requests. If planning board api url is not configured, this step should be skipped. If this step fails, it should be caught, and logged. Not critical.

6. Need to add note for batch via `POST: /planning_board/batch_notes/add_note` endpoint for planning board. Body is:
```ts
{
  jobOrder: jobOrder,
  note: `Batch was started in machine ${machineName} by operator ${operatorName}`
  userId: 1, // This is a constant value, this value correlates to CommunicationsDriver. Kinda like a application name
  userType: 0, // Means its created by a service (like CommunicationsDriver)
  showOnScreen: false
}
```
If planning board api url is not configured skip, if fails, caught and logged. Not critical.

7. We need to insert a `BatchStartEnd` record to `BatchStartEndRepository`
```ts
const batchStartEnd: BatchStartEndInsert = {
  jobOrder: event.batchCode
  machineId: machineSession.machineId
  state: BatchStartEndState.Start
  date: event.datetime
  programNoList: []
  totalRequestCount: 0
}
```

8. We need to set endtime of last active stop and commit to repository.

### CommandStartEvent

Marks the beginning of a command.

```ts
interface TonelloCommandStartEvent {
  // ... standard props ...
  commandNum: number
  stepNumTrt: number
  stepNumAct: number
  programNum: number
}
```

Command and batchStep are synonyms in this context.

```ts
const batchStep: BatchStepInsert = {
  batchKey: status.runningBatchkey,
  programNo: event.programNum,
  stepNo: event.stepNumAct,
  parallelStepNo: 0,
  commandNo: event.commandNum,
  startTime: new Date(event.datetime),
  endTime: null,
  theoreticalDuration: 0
}
```

```ts
status.runningCommandNo = event.commandNum
status.runningCommandName = commandRepository.findByMachineAndCommandNo(machineSession.machineId, event.commandNum).name
status.runningProgramNo = event.programNum
status.runningProgramName = programRepository.findByMachineAndProgramNo(machineSession.machineId, event.programNum).name
status.runningStepNo = event.stepNumAct
```

> NOTE: `event.programNum` (from `TonelloCommandStartEvent`) is not the same as the `program` field on `TonelloBatchStartEvent`. The `program` field on `BatchStartEvent` is currently unused.

### CommandFinishEvent

Marks the end of a command.

```ts
interface TonelloCommandFinishEvent extends BaseEvent {
  // ... standard properties ...
  commandNum: number
  stepNumTrt: number
  stepNumAct: number
  programNum: number
}
```

Values in event could be asserted against the supposed running command. But no need to throw error for this, just log it. We only set the `endTime` of active command and finalize it. Use `BatchStepRepository.setEndTime` with the composite key `(batchKey, programNo, stepNo, parallelStepNo, commandNo)` from the in-memory step.

```ts
batchStep.endTime = new Date(event.datetime)
```

### ChemicalRequestEvent

Chemical requests sent by machine.

```ts
interface TonelloChemicalRequestEvent extends BaseEvent {
  eventValue: typeof EventCode.ChemicalRequestEvent
  batchCode: string
  runningProgram: number
  runningCommand: number
  requestType: number
  operationCode: number
  batchTotRequestCount: number
  programTotRequestCount: number
  requestOrder: number
  tankNr: number
  priority: number // Always 50
  runningProgramIndex: number
  runningCommandIndex: number
}
```
A single mapping function is needed: `mapTonelloChemicalRequestType(type: TonelloChemicalRequestType): MaterialType`. It is used everywhere a `requestType` value must be stored (`status.requestTargetRecipe`, `chemicalRequest.targetRecipe`, `chemicalRequestString.materialType`).

Sets status:
```ts
status.requestBatchKey = status.runningBatchKey
status.requestJobOrder = event.batchCode
status.requestRecipeIndex = event.runningProgramIndex
status.requestOrderIndex = event.requestOrder
status.requestOperationCode = event.operationCode
status.requestTargetRecipe = mapTonelloChemicalRequestType(event.requestType)
status.requestTankNo = event.tankNr
status.requestPriority = event.priority
status.requestTotalCount = event.batchTotRequestCount
status.requestProgramNo = event.runningProgram
status.requestCommandNo = event.runningCommand
status.requestStatus = RequestStatus.New
```
Inserts to `ChemicalRequestRepository`

```ts
const chemicalRequest: ChemicalRequestInsert = {
  batchKey: status.runningBatchKey,
  requestTime: new Date(event.datetime),
  jobOrder: event.batchCode,
  recipeIndex: event.runningProgramIndex,
  requestOrderIndex: event.requestOrder,
  operationCode: event.operationCode,
  targetRecipe: mapTonelloChemicalRequestType(event.requestType),
  tankNo: event.tankNr,
  priority: event.priority,
  totalNumberOfRequest: event.batchTotRequestCount,
  programNo: event.runningProgram,
  commandNo: event.runningCommand,
  status: RequestStatus.New
}
```
Inserts to `ChemicalRequestStringRepository`
```ts
const chemicalRequestString: ChemicalRequestStringInsert = {
  batchKey: status.runningBatchKey,
  requestTime: new Date(event.datetime),
  isRequest: true,
  requestType: RequestType.RequestWithRecipeStep,
  priority: event.priority,
  machineNo: machineSession.machineId,
  tankNo: event.tankNr,
  batchCode: event.batchCode,
  programNo: event.runningProgram,
  requestOrderInBatch: event.requestOrder,
  requestOrderInProgram: event.requestOrder,
  totalNumberOfRequest: event.batchTotRequestCount,
  materialType: mapTonelloChemicalRequestType(event.requestType),
  programIndex: event.runningProgramIndex
}
```

### BatchCancelledEvent
### BatchEndEvent

Both of `BatchCancelledEvent` and `BatchEndEvent` events work the same, only different is one of them sets the `cancelTime`, other sets the `endTime`.

```ts
interface TonelloBatchCancelledEvent {
  // ... standard props
  batchCode: string
}
interface TonelloBatchEndEvent {
  // ... standard props
  batchCode: string
}
```

```ts
// If BatchEndEvent
batch.endTime = event.datetime
batch.realDuration = diffInSeconds(event.datetime, batch.startTime)
batch.actualTheoreticalDuration = 0
batch.deviation = 0
// If BatchCancelledEvent
batch.cancelTime = event.datetime
batch.realDuration = diffInSeconds(event.datetime, batch.startTime)
batch.cancelDetail = 1
batch.actualTheoreticalDuration = 0
batch.deviation = 0
```

Also close any open command (via `BatchStepRepository.closeAllOpen`) and insert a new `BatchStop` record to `BatchStopRepository` with `startTime = event.datetime` and a default placeholder `stopReason` (since Tonello machines do not report stop reasons).

- Then create a job order note via `POST: /planning_board/batch_notes/add_note` endpoint for planning board. Body is:
```ts
{
  jobOrder: event.batchCode,
  note: `Batch was completed` // 'Batch was cancelled' if it was cancelled
  userId: 1, // This is a constant value, this value correlates to CommunicationsDriver. Kinda like a application name
  userType: 0,
  showOnScreen: false
}
```
Then we need to add a `BatchStartEnd` record
```ts
const batchStartEnd: BatchStartEndInsert = {
  jobOrder: event.batchCode
  machineId: machineSession.machineId
  state: BatchStartEndState.End
  date: event.datetime
  programNoList: []
  totalRequestCount: 0
}
```

If planning board api url is not configured skip, if fails, caught and logged. Not critical.

After finalizing batch, we need to fetch all analog and digital values by the batchkey from their respective repositories and we need to archive them via calling currently not implemented `archiveIoValues`. After thats successful, we clear the io values belonging to the batchKey.

### IOValueChanged

Sent when IO value is change.
```ts
interface TonelloIoValueChangedEvent {
  // ... standard properties
  datetime: string
  ioType: TonelloIoType
  ioNum: string
  value: string
}
```
For every received `IOValueChanged` event where `ioType` is `AnalogInput`, `AnalogOutput` or `Counter` , we need to insert to `AnalogIoValueRepository`. For every event, we write a single row to repository.

```ts
const analogValue: AnalogValueInsert = {
  machineId: machineSession.machineId,
  batchKey: status.runningBatchKey,
  logTime: event.datetime,
  ioType: mapTonelloIoType(event.ioType), // converts from `TonelloIoType` to our `IoType`
  ioIndex: parseInt(event.ioNum),
  ioValue: parseFloat(event.value),
  source: ' ',
}
```

For every received `IOValueChanged` event where `ioType` is `DigitalInput` or `DigitalOutput`. First we update our state. Then we insert the entire state to `DigitalIoValueRepository`. We should process digital values in batches by their `datetime` value. Only after we finish processing all digital `IOValueChanged` events with the same `datetime`, we submit the state as a single row.

The digital input/output state arrays (`currentDigitalInputValues`, `currentDigitalOutputValues`) are stored as `boolean[]` on `MachineSession`, each initialized to a fixed size of **64** elements filled with `false`. Use `parseInt(event.ioNum)` as the 0-based index and set `arr[index] = event.value === '1'`. Note: `TonelloApi.fetchIOValues()` returns the *current* IO state, not the historical state at a given event time, so it cannot be used to initialize the array at session start.

```ts
const digitalValue: DigitalValueInsert = {
  batchKey: status.runningBatchKey,
  logTime: event.datetime,
  diValues: machineSession.currentDigitalInputValues,
  doFuncValues: machineSession.currentDigitalOutputValues,
  doLockValues: null,
}
```

### AlarmCreated
### AlarmConfirmed
### AlarmClearedEvent
Not going to be implemented for now.

## Chemical Request Handling

After Tonello sends a `ChemicalRequestEvent`, we need to transfer the request event to a dedicated chemical request event handler service. Since we are integrating with old systems, our integration methods are quite primitive. So we need to repeatedly poll a database to see the status of a request. The system we are integrating is called "Dispensing Manager". I will call `DM` in short. Table used in integration is called `BACHEMICALREQUESTSTRINGS` which is managed by `ChemicalRequestStringRepository`. Currently I set a method to consume a response but I learned a request will have 3 different responses at max so that method is scratched. Each inserted row by `DM` will have a different status. We need to make the service as dumb as possible. So instead of carefully picking up responses, instead we will flush all the responses in the same interval and send the responses to appropriate machines.

What `DM` does is, when we insert a request row (`isRequest = true`), it reads the row and deletes it. We will also do this, but for `isRequest = false` rows: on each poll interval, fetch all response rows (`isRequest = false`) from `ChemicalRequestStringRepository`, ordered by ID ascending. Group them by `batchKey`, route each group to the corresponding `MachineSession`, and delete each row after it has been sent. Sending must happen in ID order to avoid delivering responses out of sequence.

`findAllPendingResponses` returns rows with the string already parsed into a `ChemicalRequestStringResponseParsed` object (the repository handles this internally). Each response carries a `status: RequestStatus` field. To send a response to a machine, look up the original in-memory `TonelloChemicalRequestEvent` by the composite key `batchKey + requestOrderInBatch`, map `status` from `RequestStatus` to `TonelloChemicalRequestStatus` for the `state` field, then call `TonelloApi.submitChemicalRequestStatus(response)`. Set `message` to an empty string unless the status indicates an error.

`MachineSession` can have a method for handling a bundle of chemical request responses. For debugging purposes, maintain some in-memory request tracking at `MachineSession` level. The identifier for a request is a composite of `batchKey`, `requestOrderIndex` (and optionally `programNo`) since there is no single unique key per request.

## Missing batch end or start

We use events to understand what took place in machine and create the timeline of how the machine works. But events stored in machines are not stored indefinitely. The exact lifetime of events are currently unknown but its not important in our case anyway. Whats important is for us to how to handle cases where we miss out on some events. For example, lets say our last received event ID is **100**. We request the machine to send us events starting from that ID. But machine response sent events starting from ID **120**. This way we know we missed on some ID's. We dont necessarily need to check everytime that if we have missed events. At the start of every batch, we need to check specific events to understand if we can work with them. The base rule is, do we have the batch start/end (or cancel). For example; lets say I know a batch with code `Alpha` is running at a machine. Then we lost connection with said machine for a long time. After we finally have access to this machine, we fetched the events. To understand if we have lost any events, we need to make sure that we can still fetch the same event. If we notice our last fetch event is missing, we are going to assume we lots data. At this point, we will skip all events until we see the next `BatchStartEvent` and finalize all previous batches/commands. What I mean is setting `cancelTime` for the previously known active batch, and setting `endTime` for the previously known active command. (Commands dont have `cancelTime`). End time values should be same as the last `BatchEndEvent/BatchCancelEvent` or if there is none, we should set it to same value as the `datetime` value of the `BatchStartEvent`.

## Handling Duplicate Events

If we come accross starter events like `BatchStartEvent` and `CommandStartEvent` back to back, we should ignore the latter events and log it. In short, if a batch is already, Tonello shouldnt send a start event again until its cancelled or stopped. If a command is already running, Tonello shouldnt send a command start event again.
## MachineSession Initialization

When a `MachineSession` is created for a machine, it must restore its state from the database before starting the polling loop:

1. Load `MachineStatus` via `MachineStatusRepository.findByMachineId`. This provides `lastEventId`, `lastEventDate`, `runningBatchKey`, `runningJobOrder`, and other fields needed to resume where the driver left off.
2. If `runningBatchKey` is set, load the active `BatchData` via `BatchDataRepository.findByKey` to have the in-memory batch available.
3. The digital IO state arrays (`currentDigitalInputValues`, `currentDigitalOutputValues`) start empty. They will be populated as `IOValueChanged` events arrive.
4. If `lastEventId` and `lastEventDate` are null (first run for this machine), start polling from the current date with `from = 0`.

## BatchStop Lifecycle

A `BatchStop` represents the idle time between batches. The lifecycle is:
- **Open a stop**: Insert a new `BatchStop` record when a batch ends (`BatchEndEvent` or `BatchCancelledEvent`), with `startTime = event.datetime` and a default placeholder `stopReason` (Tonello machines do not report stop reasons).
- **Close a stop**: On `BatchStartEvent` step 8, call `BatchStopRepository.closeLatestOpen(batchKey, event.datetime)` to set the `endTime` of the currently open stop.

Note: The first stop for a machine (before any batch has ever run) is not created by the driver — it is assumed to already exist or is not tracked.

## Error Handling for fetchEvents

When `TonelloApi.fetchEvents` throws (e.g. machine is offline, network timeout), the session should:
1. Catch the error and log it.
2. Update `MachineStatus.connectionStatus` to `ConnectionStatus.NotConnected`.
3. **Not** reset or advance `lastEventId` / `lastEventDate` — the next poll attempt must retry from the same position.
4. Skip all event processing for that interval and wait for the next scheduled poll.

Once a successful response is received again, update `connectionStatus` back to `ConnectionStatus.Connected`.
## Glossary

- **MachineManager**: Tracks active machines and starts/stops MachineSession's
- **MachineSession**: Owns one machine’s polling lifecycle

