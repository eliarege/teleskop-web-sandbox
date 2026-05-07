# Event Handling Analysis

> Analyzed against `src/` as of 2026-04-10.

---

## Overview

The worker loop runs every 10 seconds. It polls the Tonello controller for events newer than `lastEventId` and dispatches them through a `switch`. Six event codes are defined; only four are meaningfully handled. IO values are also recorded on a periodic timer independent of events.

---

## Event: `BatchStartEvent` (code 7)

### What happens now

1. `handleBatchStartedEvent(event)` — **called without `await`** (fire and forget, no error handling at the call site).

   - DB reads:
     - `BFMACHINES` → get machine code
     - `DYBFBATCHPLAN` → get PLANKEY and PLANNEDMACHINEID by job order
     - `BFMASTERPRGHEADER` → get theoretical duration for the program
   - DB write (transaction):
     - `BADATA` → INSERT new batch row (BATCHKEY generated as `MAX(BATCHKEY) + 1`)
   - In-memory update: `machineStatusDB.RUNNING_BATCHKEY`, `RUNNING_JOBORDER`, `RUNNING_BATCHSTATUS = 1`, `RUNNING_JOBORDERSTARTTIME`
   - DB upsert: `TFMACHINESTATUS`

2. `recordIoValues(false)` — **called without `await`** (fire and forget, no error handling).
   - Controller read: all analog and digital IO values
   - DB write: `BADIOVALUES_CURRENT` → INSERT digital snapshot
   - DB write: `BAIOVALUES_CURRENT` → INSERT all analog inputs (iotype=1) and outputs (iotype=2)

### Issues / what should happen

- **Both calls are unawaited.** If `handleBatchStartedEvent` hasn't resolved by the time a `CommandStartEvent` arrives, `machineStatusDB.RUNNING_BATCHKEY` is still `0`, so the command step is inserted with the wrong BATCHKEY.
- **`recordIoValues(false)` does not update `lastIoRecordTime`** before the async work begins — `checkIoValuesRecordTime` can trigger a duplicate snapshot in the same loop tick.
- The BATCHKEY generation strategy (`MAX + 1` inside a transaction) is a race condition if multiple machines share the same DB and both start batches simultaneously; a sequence or identity column would be safer.
- Several `NewBatch` fields are hardcoded placeholders (`CUSTOMERNAME: 'Customer'`, `PARTYNUMBER: 'Party'`, `PLANNEDMACHINEID: 1`, `Color: 1`). These should be derived from the plan or configuration.

---

## Event: `BatchEndEvent` (code 8) and `BatchCancelledEvent` (code 10)

### What happens now

Both call `handleBatchFinishedEvent(event)` — **neither call is awaited**, no `.catch()`.

Inside `handleBatchFinishedEvent`:

1. Guard: checks `machineStatusDB.RUNNING_JOBORDER == event.batchCode`; logs and skips if mismatch.
2. `moveIoValuesToBatchFile(RUNNING_BATCHKEY)`:
   - DB reads: `BADIOVALUES_CURRENT` (all rows for BATCHKEY, asc by LOGTIME) → gzip-compressed JSON → `BADATA_FILES` INSERT (FILETYPE=7, `DigitalIO_JSON`)
   - DB reads: `BAIOVALUES_CURRENT` (all rows for BATCHKEY, ordered by IOTYPE/IOINDEX/LOGTIME) → gzip-compressed JSON → `BADATA_FILES` INSERT (FILETYPE=6, `AnalogIO_JSON`)
3. `UpdateBatchAsFinished`:
   - DB write: `BADATA` → UPDATE, sets `ENDTIME` (end) or `CANCELTIME` (cancelled)
4. `UpdateMachineStatusAsRunningJoborderFinishedAndUpdate`:
   - In-memory: resets all `RUNNING_*` fields to zero/empty
   - DB upsert: `TFMACHINESTATUS`

### Issues / what should happen

- **Neither call is awaited and there is no `.catch()`**. Errors from DB writes (e.g. duplicate insert into `BADATA_FILES`) are silently swallowed.
- **`BADIOVALUES_CURRENT` and `BAIOVALUES_CURRENT` rows are never deleted** after being moved to `BADATA_FILES`. These current-tables will grow unboundedly. After a successful `moveIoValuesToBatchFile`, rows for that BATCHKEY should be deleted from both tables.
- If `moveIoValuesToBatchFile` fails, `UpdateBatchAsFinished` is still called (there is no early return on failure). The file archival and batch close should be atomic or at least guarded.
- `BatchCancelledEvent` correctly sets `ISCANCELLED: true` by comparing `eventValue === EventCodes.BatchCancelledEvent`, but `CANCELDETAIL` in `BADATA` is never updated (it stays at its insert-time value of `0`).

---

## Event: `CommandStartEvent` (code 19)

### What happens now

`handleCommandStart(event as CommandStartEvent)` — called without `await` but with `.catch()`.

1. DB write: `BAACTUALPRGSTEPS` → INSERT with fields from the event. Several fields are hardcoded: `PARALLELSTEPNO: 0`, `COMMANDENDSTEP: 0`, `THEORETICDURATION: 0`, `PRGINDEX: 0`, `PHASENO: -1`, `PHASEINDEX: -1`, `OPTIMIZEDTHEORETICDURATION: 0`.
2. DB read: `BFMASTERCOMMANDS` → look up command name by MACHINEID and COMMANDNO.
3. In-memory update: `machineStatusDB.RUNNING_CMDNO`, `RUNNING_CMDNAME`.
4. DB upsert: `TFMACHINESTATUS`.

### Issues / what should happen

- The call is not awaited, so `machineStatusDB.RUNNING_CMDNO/NAME` may not be updated before the next loop reads or writes machine status.
- `THEORETICDURATION` and `OPTIMIZEDTHEORETICDURATION` are hardcoded `0`. These should be read from `BFMASTERPRGHEADER` or a command definition table.
- `PHASENO` and `PHASEINDEX` default to `-1` — if the controller does provide phase info in future events, these fields are ignored.

---

## Event: `CommandFinishEvent` (code 20)

### What happens now

`handleCommandFinish(event as CommandFinishEvent)` — called without `await` but with `.catch()`.

1. Builds a `CommandFinish` payload from the event (`PARALLELSTEPNO` hardcoded to `0`).
2. DB write: `BAACTUALPRGSTEPS` → UPDATE, sets `ENDTIME` where BATCHKEY, PRGNO, STEPNO, COMMANDNO match and ENDTIME is currently NULL (the `where` excludes `ENDTIME` via `{ ...input, ENDTIME: undefined }`).

### Issues / what should happen

- Not awaited. If a `CommandStartEvent` for the next step arrives before this resolves, they interleave.
- `machineStatusDB.RUNNING_CMDNO` and `RUNNING_CMDNAME` are not cleared on command finish. The machine status in the DB continues to show the last command as "running" until the next `CommandStartEvent`.
- Machine status (`TFMACHINESTATUS`) is not updated after command finish — it should be, clearing `RUNNING_CMDNO / RUNNING_CMDNAME` or updating `RUNNING_STEPNO`.

---

## Event: `ChemicalRequestEvent` (code 1)

### What happens now

```
console.log('Chemical Request Event detected, inserting new chemical request...')
```

Nothing else. There is a comment `// TODO await birpc.WriteNewRequest(event, machineId)` but it is not implemented.

### What should happen

The chemical request flow is a file-based inter-process communication with a dispensing system. The full intended flow is:

1. **DB write**: INSERT into `BACHEMICALREQUESTTONELLO` (via `insertChemicalRequest`) — records the request with `STATUS = 0` (pending).
2. **File write**: Call `WriteNewRequest` (via `birpc.WriteNewRequest` → main thread → `fileOperations.ts`). This appends a CSV line to the configured request file in the format: `2,priority,machineNo,tankNo,jobOrder,programNo,requestOrderIndex,requestOrderIndex,totalRequestCount,chemOrDye,recipeIndex,0`.
3. **Poll for answer**: `ReadAnswer` (main thread, `fileOperations.ts`) reads, renames, and parses the answer file written by the dispensing system. Parsed answers are sent back to the worker via `birpc.AnswerArrived`.
4. **Worker handles answer**: `WorkerThreadFunctions.AnswerArrived` (defined in the worker's birpc but body is empty — `// Handle answers from the main thread`) should call `updateChemicalRequest` to set STATUS and MESSAGE, and optionally update `TFMACHINESTATUS.REQ_*` fields.

None of steps 1–4 are implemented. `birpc.AnswerArrived` handler in the worker is an empty stub. The main thread never calls `ReadAnswer` on a timer.

**DB operations that should happen:**

- INSERT `BACHEMICALREQUESTTONELLO` (on event)
- UPDATE `BACHEMICALREQUESTTONELLO` STATUS/MESSAGE (on answer)
- UPDATE `TFMACHINESTATUS` REQ\_\* fields (on event and on answer)

**File operations that should happen:**

- APPEND to `{RequestPath}/{RequestFileName}{RequestFileExtension}` (on event, mutex-protected)
- RENAME + READ + DELETE `{RequestPath}/{AnswerFileName}{AnswerFileExtension}` (on answer polling timer in main thread)

---

## Periodic IO Recording (not event-driven)

### What happens now

`checkIoValuesRecordTime()` is called (not awaited) at the end of every `workerLoop` tick. If `config.ioRecordIntervalMs` (default 30 s) have elapsed since `lastIoRecordTime`, it calls `recordIoValues(true)` (only-if-changed mode):

- **Digital**: compares new DI/DO to `lastDigitalInputValues` / `lastDigitalOutputValues` using `JSON.stringify`. If different → INSERT into `BADIOVALUES_CURRENT`.
- **Analog**: per-channel comparison. Changed channels get their value; unchanged channels get `null`. `insertAnalogValues` skips nulls. → INSERT into `BAIOVALUES_CURRENT` only changed channels.

### Issues / what should happen

- `lastAnalogInputValues`, `lastAnalogOutputValues`, `lastDigitalInputValues`, `lastDigitalOutputValues` are declared but never initialized. The first call to `recordIoValues(true)` (only-if-changed) compares against `undefined`, so `JSON.stringify(undefined)` is `undefined`, which is not equal to a JSON string → a spurious write always occurs on the very first periodic tick. Worse, the analog loop iterates `lastAnalogInputValues[i]`, which throws if `lastAnalogInputValues` is `undefined`.
- `checkIoValuesRecordTime` is not awaited, and neither is `recordIoValues` inside it. IO write errors are silently dropped.
- `JSON.stringify` for deep comparison of boolean arrays is fragile. A proper deep-equal (e.g. `fast-deep-equal`) should be used.
- `boolArrayToHex` is called with `lastDigitalOutputValues` / `lastDigitalInputValues` (the **old** values) instead of the **new** values returned by `getIoValues`. This means the snapshot written to DB is always one tick stale.

---

## Summary Table

| Event                  | Code | DB Tables Written                                                                                            | File Ops    | Awaited           | Issues                                                |
| ---------------------- | ---- | ------------------------------------------------------------------------------------------------------------ | ----------- | ----------------- | ----------------------------------------------------- |
| `BatchStartEvent`      | 7    | `BADATA` (INSERT), `TFMACHINESTATUS` (UPSERT), `BADIOVALUES_CURRENT` (INSERT), `BAIOVALUES_CURRENT` (INSERT) | —           | ❌                | Race with subsequent command events; stale BATCHKEY=0 |
| `BatchEndEvent`        | 8    | `BADATA_FILES` (2× INSERT), `BADATA` (UPDATE ENDTIME), `TFMACHINESTATUS` (UPSERT)                            | —           | ❌                | Current-table rows never deleted; errors swallowed    |
| `BatchCancelledEvent`  | 10   | `BADATA_FILES` (2× INSERT), `BADATA` (UPDATE CANCELTIME), `TFMACHINESTATUS` (UPSERT)                         | —           | ❌                | Same as above; CANCELDETAIL not set                   |
| `CommandStartEvent`    | 19   | `BAACTUALPRGSTEPS` (INSERT), `TFMACHINESTATUS` (UPSERT)                                                      | —           | ❌ (has `.catch`) | Duration fields hardcoded 0                           |
| `CommandFinishEvent`   | 20   | `BAACTUALPRGSTEPS` (UPDATE ENDTIME)                                                                          | —           | ❌ (has `.catch`) | Machine status not updated on finish                  |
| `ChemicalRequestEvent` | 1    | **Nothing**                                                                                                  | **Nothing** | —                 | Entirely unimplemented                                |

---

# Tonello API Audit Report

> Tested against `http://192.168.16.92:1234` on 2026-04-07.
> Setter endpoints (`setDateTime`, `putProgram`, `putBatch`, `deleteBatch`) were skipped.
> `getEvents` was skipped — it crashes the API server.

---

## 1. Envelope Inconsistency — `getProgramsList`

All endpoints wrap their payload in `{ result, data: { ... } }` except `getProgramsList`, which puts `programsCount` and `programs` at the root alongside `result`:

```json
{
  "result": { "status": "ok", "code": 200, "message": "Ok" },
  "programsCount": 0,
  "programs": []
}
```

This is why the codebase has two duplicate methods for the same endpoint — `fetchProgramList()` (wrong return type `TonelloResponse<TonelloProgramList>`) and `fetchProgramsList()` (correct `TonelloResponseWithoutWrapper<TonelloProgramList>`). One should be removed.

---

## 2. `getStatus` and `getProgram` Return `data: null` With Status `ok`

Both return HTTP 200 with `result.status: "ok"` but `data: null`:

- **`getStatus`**: when the machine is idle, the entire status object is null.
- **`getProgram?code=1`**: when a program code doesn't exist, returns `data: null` rather than a 4xx error.

The TypeScript return types (`TonelloResponse<TonelloMachineStatus>` and `TonelloResponse<TonelloProgram>`) do not express this nullability. Callers will get a typed non-null value that is actually `null` at runtime.

---

## 3. `getLastEvent` Response Shape Doesn't Match `TonelloEvent`

Actual response `data`:

```json
{
  "batchCode": null,
  "runningProgram": 0,
  "runningCommand": 0,
  "requestType": 0,
  "operationCode": 0,
  "batchTotRequestCount": 0,
  "programTotRequestCount": 0,
  "requestOrder": 0,
  "tankNr": 0,
  "priority": 0,
  "id": 2,
  "eventValue": 1,
  "datetime": "2026-04-07T14:10:05+03:00"
}
```

The `TonelloEvent` type in `tonello.ts` expects `params: Record<string, unknown>` but no such key exists. All event-specific fields are **flattened** at the top level, not grouped into `params`. The `TonelloEvent` in `tonello-events.ts` (the refactored version) also has no `params` and correctly models them as flat discriminated union fields — but the raw API type `TonelloEvent` in `tonello.ts` needs to be corrected.

Additionally, `batchCode` is `null` for a `ChemicalRequestEvent` (`eventValue: 1`), which the refactored `ChemicalRequestEvent` type marks as `batchCode: string` (non-nullable).

---

## 4. `getFunctions` Response Shape Completely Mismatches Return Type

`fetchFunctions()` is typed as returning `TonelloResponse<TonelloFunction[]>`, but the actual response is:

```json
{
  "result": { ... },
  "data": {
    "layout": {
      "type": "washing-machine",
      "json": [ /* array of TonelloFunction items */ ]
    },
    "solution": ["error"]
  }
}
```

Issues:

- `data` is an object, not an array — it should be typed as `TonelloFunctionBody` (which already exists).
- `TonelloFunctionBody.layout.pages` should be `layout.json` — the property name is wrong in the type.
- `layout.type` (`"washing-machine"`) is not modeled anywhere.
- `solution: ["error"]` is not modeled and its meaning is unclear. The value `"error"` in the array suggests an error state but the HTTP result is `ok`.

---

## 5. Function and Configuration Params: Numeric Fields Come as Strings

For function params (`getFunctions`), all of `index`, `min`, `max`, `decimals`, and `default` are JSON strings:

```json
{ "type": "value", "index": "0", "min": "0", "max": "10000", "decimals": "0", "default": "500" }
```

The `TonelloFunctionParameterBase.index` is typed as `number`, and `TonelloFunctionParameterValue.min/max/decimals/default` are typed as `number | string`. The `index` being a string is silently wrong.

---

## 6. `getInputOutput`: All Values Are `null`

The response contains 64 `null` entries for both `digitalInputs` and `digitalOutputs`, 8 for `analogInputs`, and 4 for `analogOutputs`. These are index-position arrays with no `code` identifier per entry.

This is inconsistent with `getInputOutputList` which uses code-labelled objects (`{ code: "101", type: "DI", label: "..." }`). There is no way to correlate a value from `getInputOutput[i]` to a named IO from `getInputOutputList` without relying on implicit index ordering.

`fetchIoValues()` promises `boolean[]` as the return type but the actual values are `null`. The array-of-nulls is valid per `TDigitalValue = { code, value } | null`, but the service strips the objects and exposes `boolean[]` — that type is wrong.

---

## 7. `TonelloMachineParameter*` Types Extend Wrong Base

`TonelloMachineParameterValue`, `TonelloMachineParameterList`, and `TonelloMachineParameterBit` all extend `TonelloFunctionParameterBase` (which includes `row: number`) instead of `TonelloMachineParameterBase` (which includes `local: boolean`). Config params have `local` and no `row`:

```json
{
  "index": 269,
  "type": "value",
  "decimals": 0,
  "label": "ENU=Machine serial number",
  "value": 8522,
  "local": false
}
```

---

## 8. Empty `label` on 36 Function Params

36 parameters across all functions have `label: ""`. These are primarily `list`-type unit-selector params where the label is embedded in the option values instead (e.g., `"ENU=caption=\"Lt\""`). Still, an empty label is a presentation problem for any UI consuming this data.

---

## 9. `getAlarmsList` Alarm Code 13 Has Placeholder Label

```json
{ "code": 13, "type": "alarm", "label": "Alarm 13" }
```

All other alarms have descriptive labels. This looks like an unfinished entry.

---

## 10. `getInputOutputList` — `counters[0]` Has Empty `type`

```json
{ "code": "3", "type": "", "unit": "sec", "label": "PROGRAM TIME" }
```

`TonelloDigital` requires `type: string` so an empty string is technically valid, but it breaks any logic that dispatches on `type`.

---

## 11. `getConfiguration` — Pages 12 and 13 Share the Same Label

Both pages are labeled `"ENU=New balancing parameters"`. One is likely mislabeled.

---

## 12. Localized Label Format Has a Trailing Comma

All multi-locale labels end with a trailing comma:

```
"ENU=Filling,ESP=Llenado,ITA=Riempimento,"
```

Depending on the locale parser, this trailing comma may produce an empty last segment.

---

## 13. Missing `Accept: application/json` Returns a Non-JSON Plain String

Without the `Accept: application/json` header, the server returns:

```
"JSON Accepted needed"
```

This is a plain string (not valid JSON object), so any generic JSON error-handling middleware will fail to parse it.

---

## 14. `getEvents` Crashes the API Server

User-confirmed: calling `getEvents` is very prone to crashing the API process. No safe retry or error boundary is implemented. This endpoint should be considered unstable.

---

## Summary Table

| #   | Endpoint                  | Issue                                                                                        | Severity |
| --- | ------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| 1   | `getProgramsList`         | Non-standard envelope (no `data` key)                                                        | Medium   |
| 2   | `getStatus`, `getProgram` | `data: null` returned with `status: "ok"`                                                    | High     |
| 3   | `getLastEvent`            | Response fields flat, not in `params`; `batchCode` nullable                                  | High     |
| 4   | `getFunctions`            | Return type wrong; `layout.pages` should be `layout.json`; `solution: ["error"]` unexplained | High     |
| 5   | `getFunctions`            | `index`, `min`, `max`, `decimals`, `default` are strings not numbers                         | Medium   |
| 6   | `getInputOutput`          | All values null; no `code` per entry; `boolean[]` return type wrong                          | Medium   |
| 7   | Types only                | `TonelloMachineParameter*` extends wrong base                                                | Medium   |
| 8   | `getFunctions`            | 36 params with empty `label`                                                                 | Low      |
| 9   | `getAlarmsList`           | Alarm 13 label is placeholder                                                                | Low      |
| 10  | `getInputOutputList`      | `counters[0].type` is empty string                                                           | Low      |
| 11  | `getConfiguration`        | Pages 12 and 13 share the same label                                                         | Low      |
| 12  | All                       | Trailing comma in localized label strings                                                    | Low      |
| 13  | All                       | Non-JSON error response when `Accept` header missing                                         | Low      |
| 14  | `getEvents`               | Crashes the API server                                                                       | Critical |
