# Database Tables Schema — Communications Driver

Tables in the **Teleskop** database relevant to Tonello event processing.
Tonello events are a subset of TBB events: `BatchStartedEvent`, `BatchCanceledEvent`, `BatchCompletedEvent`, `AlarmCreated`, `AlarmConfirmed`, `AlarmClearedEvent`, `CommandStartEvent`, `CommandFinishEvent`, `ChemicalRequestEvent`.

---

## BADATA

Batch run record. Created on batch start; updated throughout the batch lifecycle.

| Column                    | Type          | PK  | Nullable | Default | Notes                                                             |
| ------------------------- | ------------- | --- | -------- | ------- | ----------------------------------------------------------------- |
| BATCHKEY                  | int           | ✓   | No       |         | Unique batch identifier                                           |
| BATCHREFERENCE            | varchar(50)   |     | No       |         |                                                                   |
| MACHINEID                 | int           |     | No       |         |                                                                   |
| MACHINECODE               | nvarchar(60)  |     | No       |         |                                                                   |
| JOBORDER                  | varchar(15)   |     | No       |         |                                                                   |
| STARTTIME                 | datetime      |     | No       |         | Batch start (BatchStartedEvent)                                   |
| ENDTIME                   | datetime      |     | Yes      |         | Batch end (BatchCompletedEvent)                                   |
| CANCELTIME                | datetime      |     | Yes      |         | Set on BatchCanceledEvent                                         |
| ENDCONFIRMTIME            | datetime      |     | Yes      |         |                                                                   |
| PRGCOUNT                  | smallint      |     | No       |         |                                                                   |
| PROGRAMNOLIST             | nvarchar(400) |     | Yes      |         |                                                                   |
| STOPREASON                | smallint      |     | Yes      |         | Is correction?                                                    |
| CORRECTIONCOUNT           | tinyint       |     | Yes      |         |                                                                   |
| ISCORRECTION              | bit           |     | No       |         |                                                                   |
| CORRECTIONREASON          | varchar(50)   |     | Yes      |         |                                                                   |
| OPRCODE                   | int           |     | Yes      |         |                                                                   |
| OPRNAME                   | nvarchar(100) |     | Yes      |         |                                                                   |
| CLIENTCODE                | varchar(30)   |     | Yes      |         |                                                                   |
| ARCHIVED                  | bit           |     | No       |         |                                                                   |
| THEORETICDURAT            | int           |     | Yes      | 0       | Theoretical duration **(seconds)**                                |
| REALDURATION              | int           |     | Yes      |         | Actual duration **(seconds)**. Updated on batch end / cancel.     |
| DEVIATION                 | int           |     | Yes      |         | Difference between theoretical and actual duration                |
| STOP_DURATION_OPER        | int           |     | Yes      |         | Operator-caused stop duration (seconds, written at batch end)     |
| STOP_DURATION_ALR         | int           |     | Yes      |         | Delays caused by command alarms (seconds, written at batch end)   |
| STOP_DURATION_WARNING_ALR | int           |     | Yes      | 0       | Delays caused by warning commands (seconds, written at batch end) |
| ACTUAL_THEORETICDURAT     | int           |     | Yes      |         |                                                                   |
| FABRIC_WEIGHT             | float         |     | Yes      | 0       |                                                                   |
| TRANSFERSTATUS            | tinyint       |     | Yes      |         |                                                                   |
| Color                     | int           |     | Yes      | 0       |                                                                   |
| startedWithPrcss          | bit           |     | Yes      | 0       |                                                                   |
| prcssId                   | int           |     | Yes      | 0       |                                                                   |
| CANCELDETAIL              | smallint      |     | No       | 1       |                                                                   |
| theoricElectricity        | bit           |     | No       | 0       |                                                                   |
| theoricWater              | bit           |     | No       | 0       |                                                                   |
| theoricSteam              | bit           |     | No       | 1       |                                                                   |
| RECIPETYPEID              | int           |     | No       | 1       |                                                                   |
| FINISHREASONID            | int           |     | Yes      |         |                                                                   |
| ADDITIONSTARTED           | bit           |     | No       | 0       |                                                                   |
| PARTCOUNT                 | int           |     | Yes      |         |                                                                   |
| PLANKEY                   | int           |     | Yes      |         |                                                                   |
| CUSTOMERNAME              | nvarchar(200) |     | Yes      |         |                                                                   |
| PARTYNUMBER               | nvarchar(200) |     | Yes      |         |                                                                   |
| PLANNEDMACHINEID          | int           |     | Yes      |         |                                                                   |
| STYLE                     | int           |     | Yes      |         |                                                                   |
| ITEM                      | int           |     | Yes      |         |                                                                   |
| COLORNAME                 | int           |     | Yes      |         |                                                                   |

---

## BAALARM

Alarm records. One row per alarm occurrence per batch.

| Column       | Type          | PK  | Nullable | Default | Notes                                                                                                                                                                                                                                                                                                                   |
| ------------ | ------------- | --- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BATCHKEY     | int           | ✓   | No       |         |                                                                                                                                                                                                                                                                                                                         |
| BATCHALARMNO | int           | ✓   | No       |         |                                                                                                                                                                                                                                                                                                                         |
| ALARMNO      | int           |     | No       |         |                                                                                                                                                                                                                                                                                                                         |
| PROGNO       | int           |     | No       |         |                                                                                                                                                                                                                                                                                                                         |
| COMMANDNO    | int           |     | No       |         |                                                                                                                                                                                                                                                                                                                         |
| STARTTIME    | datetime      |     | No       |         | Alarm start (AlarmCreated)                                                                                                                                                                                                                                                                                              |
| CONFIRMTIME  | datetime      |     | Yes      |         | Set on AlarmConfirmed                                                                                                                                                                                                                                                                                                   |
| ENDTIME      | datetime      |     | Yes      |         | Set on AlarmClearedEvent / batch end                                                                                                                                                                                                                                                                                    |
| EXPLANATION  | nvarchar(254) |     | Yes      | ''      |                                                                                                                                                                                                                                                                                                                         |
| ALARMTYPE    | tinyint       |     | Yes      | NULL    | `0` Command time exceeded · `1` Equipment alarm · `2` Warning alarm · `3` Warning command time exceeded · `4` Interlock alarm · `5` PLC alarm · `6` Software alarm · `7` Calibration alarm · `8` Coupled alarm · `9` Switched to manual (ALARMNO=5000) · `10` Job order stopped (ALARMNO=6000) · `12` EPAC system alarm |
| ISPARALLEL   | bit           |     | Yes      | 0       | `1` parallel command · `2` main command. Meaningful only when `COMMANDNO != -1`.                                                                                                                                                                                                                                        |
| PRGINDEX     | int           |     | No       | -1      |                                                                                                                                                                                                                                                                                                                         |
| PHASENO      | int           |     | No       | -1      |                                                                                                                                                                                                                                                                                                                         |
| PHASEINDEX   | int           |     | No       | -1      |                                                                                                                                                                                                                                                                                                                         |

---

## BAACTUALPRGSTEPS

Command execution records within a batch. One row per command start; updated on command finish.

| Column                     | Type     | PK  | Nullable | Default | Notes                                 |
| -------------------------- | -------- | --- | -------- | ------- | ------------------------------------- |
| BATCHKEY                   | int      | ✓   | No       |         |                                       |
| PRGNO                      | int      | ✓   | No       |         |                                       |
| STEPNO                     | int      | ✓   | No       |         |                                       |
| PARALLELSTEPNO             | int      | ✓   | No       |         |                                       |
| COMMANDNO                  | int      | ✓   | No       |         |                                       |
| STARTTIME                  | datetime | ✓   | No       |         | Set on CommandStartEvent              |
| ENDTIME                    | datetime |     | Yes      |         | Set on CommandFinishEvent / batch end |
| COMMANDENDSTEP             | int      |     | Yes      |         |                                       |
| THEORETICDURATION          | int      |     | Yes      | 0       |                                       |
| PRGINDEX                   | int      |     | No       | -1      |                                       |
| PHASENO                    | int      |     | Yes      |         |                                       |
| PHASEINDEX                 | int      |     | Yes      |         |                                       |
| OPTIMIZEDTHEORETICDURATION | int      |     | Yes      |         |                                       |

---

## TFMACHINESTATUS

Machine state — one row per machine, updated after every event.

| Column                                   | Type          | PK  | Nullable | Default   | Notes                                                                                                     |
| ---------------------------------------- | ------------- | --- | -------- | --------- | --------------------------------------------------------------------------------------------------------- |
| MACHINEID                                | int           | ✓   | No       |           |                                                                                                           |
| UPDATETIME                               | datetime      |     | Yes      |           |                                                                                                           |
| LASTEVENTPROCESSDATE                     | float         |     | Yes      |           |                                                                                                           |
| LASTEVENTPROCESSID                       | int           |     | Yes      |           |                                                                                                           |
| LASTREFERENCENUMBER                      | int           |     | Yes      |           |                                                                                                           |
| LASTREFERENCEDATE                        | smalldatetime |     | Yes      |           |                                                                                                           |
| RUNNING_JOBORDER                         | nvarchar(100) |     | Yes      |           | Running job order number. Empty or NULL = machine is idle.                                                |
| RUNNING_JOBORDERSTARTTIME                | datetime      |     | Yes      |           | Running job order start time                                                                              |
| RUNNING_PROGNOLIST                       | varchar(127)  |     | Yes      |           | Comma-separated theoretical program list for the running job order                                        |
| RUNNING_BATCHKEY                         | int           |     | Yes      |           | Unique key of the running job order                                                                       |
| RUNNING_BATCHSTATUS                      | int           |     | Yes      |           | `0` idle · `1` stopped · `2` running                                                                      |
| RUNNING_AUTOMANSTATUS                    | int           |     | Yes      |           | `-1` unknown · `0` manual · `1` automatic                                                                 |
| RUNNING_PROGRAMID                        | int           |     | Yes      |           |                                                                                                           |
| RUNNING_PROGRAMNAME                      | nvarchar(300) |     | Yes      |           |                                                                                                           |
| RUNNING_STEPNO                           | int           |     | Yes      |           |                                                                                                           |
| RUNNING_CMDNO                            | int           |     | Yes      |           |                                                                                                           |
| RUNNING_CMDNAME                          | nvarchar(200) |     | Yes      |           |                                                                                                           |
| RUNNING_ALARMNO                          | int           |     | Yes      |           |                                                                                                           |
| RUNNING_ALARMNAME                        | nvarchar(300) |     | Yes      |           |                                                                                                           |
| RUNNING_OPRNO                            | int           |     | Yes      |           |                                                                                                           |
| RUNNING_OPRNAME                          | nvarchar(200) |     | Yes      |           |                                                                                                           |
| RUNNING_THEOTIME                         | float         |     | Yes      |           | Theoretical job order duration based on selected programs (seconds)                                       |
| RUNNING_PHASENO                          | int           |     | Yes      | 0         |                                                                                                           |
| RUNNING_PHASENAME                        | nvarchar(300) |     | Yes      | ''        |                                                                                                           |
| RUNNING_PHASESTEPNO                      | int           |     | Yes      | 0         |                                                                                                           |
| ISCOUPLED                                | bit           |     | Yes      | 0         |                                                                                                           |
| REQ_BATCHKEY                             | int           |     | Yes      |           |                                                                                                           |
| REQ_JOBORDER                             | nvarchar(30)  |     | Yes      |           |                                                                                                           |
| REQ_RECIPEINDEX                          | int           |     | Yes      |           |                                                                                                           |
| REQ_REQORDERINDEX                        | int           |     | Yes      |           | Request order index. If `> -1` there is an active request.                                                |
| REQ_OPERATIONCODE                        | int           |     | Yes      |           |                                                                                                           |
| REQ_TARGETRECIPE                         | int           |     | Yes      |           |                                                                                                           |
| REQ_TANKNO                               | int           |     | Yes      |           |                                                                                                           |
| REQ_PRIORITY                             | int           |     | Yes      |           |                                                                                                           |
| REQ_TOTALREQCOUNT                        | int           |     | Yes      |           |                                                                                                           |
| REQ_PRGNO                                | int           |     | Yes      |           |                                                                                                           |
| REQ_CMDNO                                | int           |     | Yes      |           |                                                                                                           |
| REQ_STATUS                               | int           |     | Yes      |           | `0` new · `1` sent to dispenser · `2` dispensing started · `3` completed · `8` cancelled                  |
| CONSUMPTION_ELECTRICITY_START            | real          |     | Yes      | NULL      |                                                                                                           |
| CONSUMPTION_ELECTRICITY_EXPORT_START     | real          |     | Yes      | NULL      |                                                                                                           |
| CONSUMPTION_ELECTRICITY_CAPACITIVE_START | real          |     | Yes      | NULL      |                                                                                                           |
| CONSUMPTION_ELECTRICITY_REACTIVE_START   | real          |     | Yes      | NULL      |                                                                                                           |
| LASTRECEIVEDEVENTDATE                    | float         |     | Yes      | 0         |                                                                                                           |
| LASTRECEIVEDEVENTID                      | int           |     | Yes      | 0         |                                                                                                           |
| LASTRECEIVEDBATCHEVENTDATE               | float         |     | Yes      | 0         |                                                                                                           |
| stopReason                               | nvarchar(400) |     | Yes      |           | Why the machine is idle (stop reason)                                                                     |
| stopReasonDateTime                       | datetime      |     | Yes      |           |                                                                                                           |
| ConnectionStatus                         | int           |     | Yes      | -1        | `0` Unknown · `1` Connected · `2` NotConnected · `3` Pending · `4` ConnectedDifferentRTC · `5` BatteryLow |
| IsSynchronizing                          | bit           |     | Yes      | 0         |                                                                                                           |
| currentTemp                              | float         |     | Yes      | 0         | Machine temperature                                                                                       |
| currentAlarmStatus                       | int           |     | Yes      | -1        | `0` New · `1` Confirmed · `2` Cleared / no alarm                                                          |
| runningCompletionRatio                   | int           |     | Yes      | -1        | Running job order completion ratio (percentage)                                                           |
| lastPingFail                             | datetime      |     | No       | 0         |                                                                                                           |
| lastSoapFail                             | datetime      |     | No       | 0         |                                                                                                           |
| conWater1                                | real          |     | Yes      | 0         |                                                                                                           |
| conWater2                                | real          |     | Yes      | 0         |                                                                                                           |
| conWater1Last                            | real          |     | Yes      | 0         |                                                                                                           |
| conWater2Last                            | real          |     | Yes      | 0         |                                                                                                           |
| conElectricity                           | real          |     | Yes      | 0         |                                                                                                           |
| conElectricityLast                       | real          |     | Yes      | 0         |                                                                                                           |
| conReadDate                              | datetime      |     | Yes      | getdate() |                                                                                                           |
| conSteam                                 | real          |     | Yes      | 0         |                                                                                                           |
| conSteamLast                             | real          |     | Yes      | 0         |                                                                                                           |
| conSteamReadDate                         | datetime      |     | Yes      | getdate() |                                                                                                           |
| manuelReason                             | nvarchar(400) |     | Yes      |           |                                                                                                           |
| manuelReasonDateTime                     | datetime      |     | Yes      |           |                                                                                                           |
| MANUELCOMMANDACTIVE                      | bit           |     | No       | 0         |                                                                                                           |
| RUNNINGBATCHDELAY                        | int           |     | No       | -1        |                                                                                                           |
| LASTEVENTCODE                            | int           |     | Yes      |           |                                                                                                           |
| BATCHLOADED                              | bit           |     | Yes      | 0         |                                                                                                           |

---

## BACONSUMPTION

Consumption totals per batch (water, electricity, steam, salt).

| Column                 | Type           | PK  | Nullable | Default | Notes                  |
| ---------------------- | -------------- | --- | -------- | ------- | ---------------------- |
| CONSUMPTIONKEY         | int (identity) | ✓   | No       |         |                        |
| MACHINEID              | int            | ✓   | No       |         |                        |
| BATCHKEY               | int            | ✓   | No       |         |                        |
| FM1VALUE–FM10VALUE     | real           |     | Yes      |         | Flowmeter values 1–10  |
| ELECTRICITY            | real           |     | Yes      |         | kWh                    |
| ELECTRICITY_EXPORT     | real           |     | Yes      |         |                        |
| ELECTRICITY_CAPACITIVE | real           |     | Yes      |         |                        |
| ELECTRICITY_REACTIVE   | real           |     | Yes      |         |                        |
| STEAM                  | real           |     | Yes      |         |                        |
| WaterType1–WaterType6  | real           |     | Yes      | 0       | Per-type water volumes |
| WaterTotal             | real           |     | Yes      | 0       |                        |
| COUNTER1               | decimal(15,3)  |     | No       | 0       |                        |
| COUNTER2               | decimal(15,3)  |     | No       | 0       |                        |
| SALT                   | decimal(15,3)  |     | No       | 0       |                        |

---

## BACONSUMPTIONPROGRAM

Consumption totals per program within a batch.

| Column                 | Type           | PK  | Nullable | Default | Notes |
| ---------------------- | -------------- | --- | -------- | ------- | ----- |
| CONSUMPTIONKEY         | int (identity) | ✓   | No       |         |       |
| MACHINEID              | int            | ✓   | No       |         |       |
| BATCHKEY               | int            | ✓   | No       |         |       |
| PROGRAMNO              | int            | ✓   | No       |         |       |
| FM1VALUE–FM10VALUE     | real           |     | Yes      |         |       |
| ELECTRICITY            | real           |     | Yes      |         |       |
| ELECTRICITY_EXPORT     | real           |     | Yes      |         |       |
| ELECTRICITY_CAPACITIVE | real           |     | Yes      |         |       |
| ELECTRICITY_REACTIVE   | real           |     | Yes      |         |       |
| STEAM                  | real           |     | Yes      |         |       |
| progIndexInBatch       | int            |     | Yes      | -1      |       |
| WaterType1–WaterType6  | real           |     | Yes      | 0       |       |
| WaterTotal             | real           |     | Yes      | 0       |       |
| SALT                   | decimal(15,3)  |     | No       | 0       |       |

---

## BACOMMANDTIMEOUTREASONS

Reasons recorded when a command exceeds its theoretical duration.

| Column             | Type              | PK  | Nullable | Default | Notes                            |
| ------------------ | ----------------- | --- | -------- | ------- | -------------------------------- |
| ID                 | bigint (identity) | ✓   | No       |         |                                  |
| BATCHKEY           | int               |     | No       |         |                                  |
| PROGNO             | int               |     | No       |         |                                  |
| PRGINDEX           | tinyint           |     | No       |         |                                  |
| STEPNO             | int               |     | No       |         |                                  |
| PARALLELSTEPNO     | tinyint           |     | No       |         |                                  |
| COMMANDNO          | int               |     | No       |         |                                  |
| ALARMNO            | int               |     | No       |         |                                  |
| STARTTIME          | datetime          |     | No       |         |                                  |
| ENDTIME            | datetime          |     | Yes      |         | Closed on batch end / alarm stop |
| REASONID           | int               |     | No       |         |                                  |
| REASONTEXT         | nvarchar(300)     |     | No       |         |                                  |
| REASONSELECTEDTIME | datetime          |     | No       |         |                                  |

---

## BASTOPS

Batch stop (pause) records.

| Column      | Type           | PK  | Nullable | Default | Notes                    |
| ----------- | -------------- | --- | -------- | ------- | ------------------------ |
| STOPNUMBER  | int (identity) | ✓   | No       |         |                          |
| MACHINEID   | int            |     | No       |         |                          |
| BATCHKEY    | int            |     | No       |         |                          |
| STOPREASON  | int            |     | No       |         |                          |
| STARTTIME   | datetime       |     | No       |         | Set on BatchStopped      |
| ENDTIME     | datetime       |     | Yes      |         | Closed on BatchContinued |
| EXPLANATION | varchar(127)   |     | Yes      |         |                          |
| ARCHIVED    | bit            |     | Yes      | 0       |                          |

---

## BAINTERVENTION

Runtime intervention log (manual commands, additions, etc.).

| Column        | Type           | PK  | Nullable | Default | Notes                                                                                                                                                                                                                  |
| ------------- | -------------- | --- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INTERVENTKEY  | int (identity) | ✓   | No       |         |                                                                                                                                                                                                                        |
| MACHINEID     | int            | ✓   | No       |         |                                                                                                                                                                                                                        |
| BATCHKEY      | int            | ✓   | No       |         |                                                                                                                                                                                                                        |
| EVENTID       | int            |     | Yes      | 0       | `52` command parameter changed · `53` command IO changed · `63` main step added · `64` main step deleted · `65` parallel step added · `66` parallel step deleted · `70` job order changed · `100` start button pressed |
| INTERVENTTIME | datetime       |     | Yes      |         |                                                                                                                                                                                                                        |
| P1            | nvarchar(510)  |     | Yes      | ''      | Generic parameter 1                                                                                                                                                                                                    |
| P2            | nvarchar(510)  |     | Yes      | ''      | Generic parameter 2                                                                                                                                                                                                    |
| P3            | nvarchar(510)  |     | Yes      | ''      | Generic parameter 3                                                                                                                                                                                                    |
| EXPLANATION   | nvarchar(800)  |     | Yes      | ''      |                                                                                                                                                                                                                        |

---

## BAINTERVENTION_BEFORESTART

Pre-start intervention records (e.g. batch load, request batch start checks).

| Column        | Type           | PK  | Nullable | Default | Notes |
| ------------- | -------------- | --- | -------- | ------- | ----- |
| INTERVENTKEY  | int (identity) | ✓   | No       |         |       |
| MACHINEID     | int            | ✓   | No       |         |       |
| JOBORDER      | varchar(15)    | ✓   | No       |         |       |
| EVENTID       | int            |     | Yes      | 0       |       |
| INTERVENTTIME | datetime       |     | Yes      |         |       |
| P1            | nvarchar(510)  |     | Yes      |         |       |
| P2            | nvarchar(510)  |     | Yes      |         |       |
| P3            | nvarchar(510)  |     | Yes      |         |       |
| EXPLANATION   | nvarchar(800)  |     | Yes      |         |       |

---

## BABATCHPARAMETERS

Batch header parameters (program-level recipe parameters stored per batch).

| Column           | Type          | PK  | Nullable | Default | Notes          |
| ---------------- | ------------- | --- | -------- | ------- | -------------- |
| BATCHKEY         | int           | ✓   | No       |         |                |
| BATCHPARAMETERID | int           | ✓   | No       |         |                |
| CHANGEDATE       | datetime      | ✓   | No       | 0       |                |
| PARAMSTRING      | nvarchar(100) |     | Yes      |         | Parameter name |
| VALUE            | real          |     | Yes      |         | Numeric value  |
| PARAMETERTYPE    | int           |     | Yes      |         |                |
| SELECTIONLIST    | varchar(1023) |     | Yes      |         |                |
| PROGNO           | int           |     | Yes      |         |                |
| PROGNAME         | nvarchar(160) |     | Yes      |         |                |

---

## BFMACHINES

Machine configuration table (one row per machine).

| Column                        | Type          | PK  | Nullable | Default | Notes                           |
| ----------------------------- | ------------- | --- | -------- | ------- | ------------------------------- |
| MACHINEID                     | int           | ✓   | No       |         |                                 |
| MACHINECODE                   | nvarchar(60)  |     | No       |         |                                 |
| GRUPNO                        | int           |     | No       | 0       |                                 |
| TBBMODEL                      | varchar(30)   |     | No       |         |                                 |
| VERSION                       | nvarchar(100) |     | Yes      | ''      |                                 |
| IP                            | varchar(15)   |     | No       |         |                                 |
| PORT                          | int           |     | No       |         |                                 |
| INUSE                         | bit           |     | No       | 0       |                                 |
| ISVIRTUAL                     | bit           |     | No       | 0       |                                 |
| LASTEVENTPROCESSDATE          | smalldatetime |     | Yes      |         |                                 |
| LASTEVENTPROCESSID            | int           |     | Yes      |         |                                 |
| LASTJOBORDER                  | varchar(15)   |     | Yes      |         |                                 |
| LASTBATCHKEY                  | int           |     | Yes      |         |                                 |
| BATCHDOWNLOADSTATUS           | tinyint       |     | Yes      | 0       | Updated by RequestBatchDownload |
| BATCHNO                       | varchar(15)   |     | Yes      | NULL    |                                 |
| BATCHDOWNLOADSTATUSCHANGETIME | datetime      |     | Yes      | NULL    |                                 |
| ONLINEACTIVE                  | bit           |     | Yes      | 1       |                                 |
| IsMaster                      | bit           |     | No       | 0       |                                 |
| SlaveMachine                  | int           |     | No       | -1      |                                 |
| theoricElectricity            | bit           |     | No       | 0       |                                 |
| theoricWater                  | bit           |     | No       | 0       |                                 |
| theoricSteam                  | bit           |     | No       | 1       |                                 |
| USEINTELESKOP                 | bit           |     | No       | 1       |                                 |
| MACHINECAPACITY               | real          |     | No       |         |                                 |
| THEORICALCHARGE               | int           |     | No       |         |                                 |
| REELCOUNT                     | int           |     | Yes      | 0       |                                 |
| NOZZLECOUNT                   | int           |     | Yes      | 0       |                                 |

---

## BAIOVALUES_CURRENT

Current analog I/O values (most recent value per I/O point).

| Column    | Type              | PK  | Nullable | Default | Notes |
| --------- | ----------------- | --- | -------- | ------- | ----- |
| IOKEY     | bigint (identity) | ✓   | No       |         |       |
| MACHINEID | tinyint           |     | No       |         |       |
| BATCHKEY  | int               |     | No       | 0       |       |
| LOGTIME   | datetime          |     | Yes      |         |       |
| IOTYPE    | tinyint           |     | No       |         |       |
| IOINDEX   | tinyint           |     | No       |         |       |
| IOVALUE   | real              |     | No       |         |       |
| SOURCE    | char(1)           |     | Yes      | ''      |       |

---

## BADIOVALUES_CURRENT

Current digital I/O values (DO function, DO lock, DI bitmask strings).

| Column       | Type              | PK  | Nullable | Default | Notes |
| ------------ | ----------------- | --- | -------- | ------- | ----- |
| IOKEY        | bigint (identity) | ✓   | No       |         |       |
| BATCHKEY     | int               |     | No       |         |       |
| LOGTIME      | datetime          |     | Yes      |         |       |
| DOFuncValues | varchar(64)       |     | Yes      |         |       |
| DOLockValues | varchar(64)       |     | Yes      |         |       |
| DIValues     | varchar(64)       |     | Yes      |         |       |

---

## BAVINVALUES_CURRENT

Current virtual input values.

| Column   | Type     | PK  | Nullable | Notes            |
| -------- | -------- | --- | -------- | ---------------- |
| BATCHKEY | int      |     | No       |                  |
| LOGTIME  | datetime |     | Yes      |                  |
| VIID     | int      |     | No       | Virtual input ID |
| VALUE    | smallint |     | No       |                  |

---

## BACYCLETIMES / BACYCLETIMES_CURRENT

Reel cycle time records. `BACYCLETIMES_CURRENT` adds a `CYCLEDATETIME` column.

| Column        | Type     | Nullable | Default | Notes                       |
| ------------- | -------- | -------- | ------- | --------------------------- |
| BATCHKEY      | int      | No       |         |                             |
| REELNO        | tinyint  | Yes      | 0       |                             |
| CYCLECOUNT    | smallint | Yes      | 0       |                             |
| CYCLETIME     | smallint | Yes      | 0       | Milliseconds                |
| COMMANDNO     | tinyint  | Yes      | 0       |                             |
| CYCLEDATETIME | datetime | Yes      |         | `BACYCLETIMES_CURRENT` only |

---

## BAAIVALUES

Analog input (AI) start/end values per command execution.

| Column           | Type           | PK  | Nullable | Notes                         |
| ---------------- | -------------- | --- | -------- | ----------------------------- |
| AINKEY           | int (identity) | ✓   | No       |                               |
| MACHINEID        | tinyint        |     | Yes      |                               |
| BATCHKEY         | int            |     | Yes      |                               |
| PRGNO            | int            |     | Yes      |                               |
| STEPNO           | smallint       |     | Yes      |                               |
| PARALLELSTEPNO   | tinyint        |     | Yes      |                               |
| COMMANDNO        | tinyint        |     | Yes      |                               |
| STARTTIME        | smalldatetime  |     | No       | Set on CommandStartedAiValue  |
| ENDTIME          | smalldatetime  |     | Yes      | Set on CommandFinishedAiValue |
| AIN1_START_VALUE | real           |     | Yes      |                               |
| AIN2_START_VALUE | real           |     | Yes      |                               |
| AIN3_START_VALUE | real           |     | Yes      |                               |
| AIN1_END_VALUE   | real           |     | Yes      |                               |
| AIN2_END_VALUE   | real           |     | Yes      |                               |
| AIN3_END_VALUE   | real           |     | Yes      |                               |

---

## BASETPOINTCHANGES

Runtime setpoint changes during a batch.

| Column           | Type              | PK  | Nullable | Default | Notes          |
| ---------------- | ----------------- | --- | -------- | ------- | -------------- |
| AutoNumber       | bigint (identity) | ✓   | No       |         |                |
| BATCHKEY         | int               |     | No       |         |                |
| CHANGEDATE       | datetime          |     | No       |         |                |
| PROGNO           | int               |     | No       |         |                |
| PROGINDEXINBATCH | smallint          |     | No       | -1      |                |
| MAINSTEP         | smallint          |     | No       |         |                |
| PARALELSTEP      | smallint          |     | No       |         |                |
| COMMANDNO        | tinyint           |     | No       |         |                |
| SPINDEX          | tinyint           |     | No       |         | Setpoint index |
| OLDVALUE         | numeric(13,3)     |     | No       |         |                |
| NEWVALUE         | numeric(13,3)     |     | No       |         |                |
| PRGINDEX         | int               |     | No       | -1      |                |
| PHASENO          | int               |     | No       | -1      |                |
| PHASEINDEX       | int               |     | No       | -1      |                |

---

## BASTEPCHANGES

Runtime step additions/removals during a batch.

| Column      | Type              | PK  | Nullable | Notes                         |
| ----------- | ----------------- | --- | -------- | ----------------------------- |
| AutoNumber  | bigint (identity) | ✓   | No       |                               |
| BATCHKEY    | int               |     | No       |                               |
| CHANGEDATE  | datetime          |     | No       |                               |
| MAINSTEP    | smallint          |     | No       |                               |
| PARALELSTEP | smallint          |     | No       |                               |
| COMMANDNO   | tinyint           |     | No       |                               |
| STEPADDED   | bit               |     | No       | true = added, false = removed |

---

## BAUSERACTIVITY

User login/logout activity log per machine.

| Column       | Type              | PK  | Nullable | Notes |
| ------------ | ----------------- | --- | -------- | ----- |
| ACTIVITYID   | bigint (identity) | ✓   | No       |       |
| MACHINEID    | int               |     | No       |       |
| USERID       | int               |     | No       |       |
| USERNAME     | nvarchar(50)      |     | Yes      |       |
| USERLASTNAME | nvarchar(50)      |     | Yes      |       |
| ACTIVITYDATE | datetime          |     | No       |       |

---

## BACALCULATEDVALUES

Calculated/derived process values logged during a batch.

| Column     | Type     | Nullable | Default | Notes |
| ---------- | -------- | -------- | ------- | ----- |
| BATCHKEY   | int      | No       |         |       |
| LOGTIME    | datetime | No       |         |       |
| PROGNO     | int      | No       |         |       |
| VALUEID    | int      | No       |         |       |
| VALUE      | real     | No       |         |       |
| PRGINDEX   | int      | No       | -1      |       |
| PHASENO    | int      | No       | -1      |       |
| PHASEINDEX | int      | No       | -1      |       |

---

## BADAILYWATERCONSUMPTION

Daily water consumption summary per machine.

| Column          | Type              | PK  | Nullable | Default | Notes                        |
| --------------- | ----------------- | --- | -------- | ------- | ---------------------------- |
| AutoNumber      | bigint (identity) | ✓   | No       |         |                              |
| machineId       | int               |     | No       |         |                              |
| consumptionDate | datetime          |     | No       |         | Calendar date of consumption |
| eventDate       | datetime          |     | No       |         | Timestamp of the event       |
| allTypeDaily    | decimal(14,2)     |     | No       |         |                              |
| allTypeTotal    | decimal(14,2)     |     | No       |         |                              |
| archived        | bit               |     | No       | 0       |                              |

---

## BASTEPSKIPPINGREASONS

Records when a batch operator skips steps and the reason provided.

| Column                 | Type              | PK  | Nullable | Notes |
| ---------------------- | ----------------- | --- | -------- | ----- |
| AutoNumber             | bigint (identity) | ✓   | No       |       |
| BATCHKEY               | int               |     | No       |       |
| REASONID               | smallint          |     | No       |       |
| REASONTEXT             | nvarchar(500)     |     | No       |       |
| OPERATOR               | smallint          |     | No       |       |
| SKIPPINGTIME           | datetime          |     | No       |       |
| SKIPPINGCOMMANDS       | nvarchar(60)      |     | No       |       |
| THEORICDURATION        | smallint          |     | No       |       |
| WORKINGDURATION        | smallint          |     | No       |       |
| ACTIVESTEPSKIPPEDFROM  | smallint          |     | No       |       |
| ACTIVESTEPSKIPPEDTO    | smallint          |     | No       |       |
| THEORICSTEPSKIPPEDFROM | smallint          |     | No       |       |
| THEORICSTEPSKIPPEDTO   | smallint          |     | No       |       |
| PROGRAMNOSKIPPEDFROM   | int               |     | No       |       |
| PROGRAMTYPESKIPPEDFROM | smallint          |     | No       |       |
| PROGRAMNAMESKIPPEDFROM | nvarchar(160)     |     | No       |       |
| PROGRAMNOSKIPPEDTO     | int               |     | No       |       |
| PROGRAMTYPESKIPPEDTO   | smallint          |     | No       |       |
| PROGRAMNAMESKIPPEDTO   | nvarchar(160)     |     | No       |       |
| NEWSTEPCOMMANDS        | nvarchar(60)      |     | No       | ''    |

---

## BAMANUELMEASUREDPROCESSVALUES

Manual process value measurements entered by the operator.

| Column              | Type          | Nullable | Notes |
| ------------------- | ------------- | -------- | ----- |
| BATCHKEY            | int           | No       |       |
| PRGNO               | int           | No       |       |
| STEPNO              | int           | No       |       |
| PARALLELSTEPNO      | int           | No       |       |
| COMMANDNO           | int           | No       |       |
| MeasurementDateTime | datetime      | No       |       |
| MEASUREDVALUE       | numeric(12,4) | Yes      |       |

---

## BACONSUMPTIONTIMESTAMP

Periodic (minutely) electricity consumption snapshots per machine.

| Column                    | Type           | PK  | Nullable | Notes |
| ------------------------- | -------------- | --- | -------- | ----- |
| CKEY                      | int (identity) | ✓   | No       |       |
| MACHINEID                 | int            | ✓   | No       |       |
| LOGTIME                   | datetime       |     | No       |       |
| ELECTRICITY               | real           |     | Yes      |       |
| ELECTRICITY_EXPORT        | real           |     | Yes      |       |
| ELECTRICITY_CAPACITIVE    | real           |     | Yes      |       |
| ELECTRICITY_REACTIVE      | real           |     | Yes      |       |
| ELECTRICITY_INSTANT_POWER | real           |     | Yes      |       |
