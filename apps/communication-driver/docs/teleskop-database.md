# Teleskop Database — v1.4 (TR)

> Source: Confluence page ID 1704034555 — _Teleskop Database - 1.4 - TR_
> Last modified: 23/Oct/2025 · Author: Selman DADAK

---

## General Information

### BFMACHGROUP

Machine groups table.

| Column    | Description                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GROUPID   | Unique group number                                                                                                                                        |
| GROUPNAME | Group name                                                                                                                                                 |
| GROUPTYPE | Group type: `0` Fabric HT · `1` Fabric OF · `2` Bobbin · `3` Sample · `4` Flok · `5` Washing · `6` Washing Dyeing · `7` Dryer · `8` (not used) · `9` Other |

---

### BFMACHINES

Machines (dyeing / washing / drying) registered in Teleskop.

| Column                          | Description                                                                                                                                                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MACHINEID                       | Machine number. All plant-level operations use this ID. Must match the machine number defined in dispensing and ERP systems.                                                                                                                         |
| MACHINECODE                     | Machine name                                                                                                                                                                                                                                         |
| GRUPNO                          | Foreign key → `BFMACHGROUP.GROUPID`                                                                                                                                                                                                                  |
| TBBMODEL                        | Controller model (`TBB6500`, `TBB7000`, `T7000/T710-PLC`, `T712`, `T7700`, `T7701ex`, `T711ex`)                                                                                                                                                      |
| VERSION                         | Controller software version. Use the Machines application to keep this up to date.                                                                                                                                                                   |
| THEORICALCHARGE                 | Daily theoretical charge count                                                                                                                                                                                                                       |
| MACHINECAPACITY                 | Machine capacity                                                                                                                                                                                                                                     |
| IP                              | Controller IP address                                                                                                                                                                                                                                |
| INUSE                           | `1` = machine is in use; `0` = Teleskop does not receive data from this device                                                                                                                                                                       |
| REELCOUNT                       | Reel count (fabric dye machines only)                                                                                                                                                                                                                |
| NOZZLECOUNT                     | Nozzle count (fabric dye machines only)                                                                                                                                                                                                              |
| RESERVETANK                     | Has reserve tank                                                                                                                                                                                                                                     |
| ADDITIONALTANK1                 | Has additional tank 1                                                                                                                                                                                                                                |
| ADDITIONALTANK2                 | Has additional tank 2                                                                                                                                                                                                                                |
| ADDITIONALTANK3                 | Has additional tank 3                                                                                                                                                                                                                                |
| ADDITIONALTANK4                 | Has additional tank 4                                                                                                                                                                                                                                |
| LANGUAGEID                      | Controller project language: `0` Turkish · `1` English · `2` Russian · `3` Persian · `4` Persian Latin · `5` Portuguese · `6` Spanish · `7` Arabic · `8` Chinese · `9` Simplified Chinese · `10` Greek · `11` Malay · `14` Vietnamese · `15` Serbian |
| theoricalChargeDuration         | Theoretical duration of one charge (batch / job order)                                                                                                                                                                                               |
| IsMaster                        | Master machine in a Master-Slave pair                                                                                                                                                                                                                |
| SlaveMachine                    | If `IsMaster = 1`, holds the slave machine ID                                                                                                                                                                                                        |
| MTTempIo                        | Analogue input for main boiler temperature. `-1` means the first analogue input is used.                                                                                                                                                             |
| MaxReelSpeed                    | Maximum reel speed (fabric dye machines only)                                                                                                                                                                                                        |
| ProductModel                    | Controller model                                                                                                                                                                                                                                     |
| HardwareModel                   | Device hardware information                                                                                                                                                                                                                          |
| PlcModel                        | PLC model                                                                                                                                                                                                                                            |
| USEINTELESKOP                   | Use in Teleskop flag. Created for machines whose process information is not processed by Teleskop but whose consumption needs to be tracked. Also usable for Teleskop1 machines.                                                                     |
| WATERCOUNTERID                  | Water counter ID                                                                                                                                                                                                                                     |
| STEAMUNIT                       | Steam unit                                                                                                                                                                                                                                           |
| WATERTYPE_0_DO – WATERTYPE_6_DO | Digital inputs for water types 1–7                                                                                                                                                                                                                   |
| THEORETICALWATER                | Theoretical water calculation active                                                                                                                                                                                                                 |
| STEAMKGPERHOUR                  | Theoretical steam consumption per hour                                                                                                                                                                                                               |
| THEORETICALSTEAM                | Theoretical steam calculation active. When active, time intervals where `STEAMVALVEDO = 1` are summed and multiplied by `STEAMKGPERHOUR` to compute theoretical steam consumption.                                                                   |
| STEAMVALVEDO                    | Digital output that opens the steam valve                                                                                                                                                                                                            |
| ELECTRICITYCOUNTERID            | Electricity counter ID                                                                                                                                                                                                                               |

---

### TFMACHINESTATUS

Holds the **real-time machine state**. One row per machine.

| Column                    | Description                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| MACHINEID                 | Machine ID                                                                                                                          |
| RUNNING_JOBORDER          | Running job order number. Empty or NULL = machine is idle.                                                                          |
| RUNNING_JOBORDERSTARTTIME | Start time of the running job order                                                                                                 |
| RUNNING_PROGNOLIST        | Comma-separated theoretical program list for the running job order                                                                  |
| RUNNING_BATCHKEY          | Unique key of the running job order (→ `BADATA.BATCHKEY`)                                                                           |
| RUNNING_BATCHSTATUS       | Job order status on the machine: `0` idle · `1` stopped · `2` running                                                               |
| RUNNING_AUTOMANSTATUS     | Auto/manual mode: `-1` unknown · `0` manual · `1` automatic                                                                         |
| RUNNING_PROGRAMID         | Running program number                                                                                                              |
| RUNNING_PROGRAMNAME       | Running program name                                                                                                                |
| RUNNING_STEPNO            | Running step number                                                                                                                 |
| RUNNING_CMDNO             | Running command number                                                                                                              |
| RUNNING_CMDNAME           | Running command name                                                                                                                |
| RUNNING_ALARMNO           | Active alarm number (if any)                                                                                                        |
| RUNNING_ALARMNAME         | Active alarm text                                                                                                                   |
| RUNNING_OPRNO             | Active operator number on the device                                                                                                |
| RUNNING_OPRNAME           | Active operator name on the device                                                                                                  |
| RUNNING_THEOTIME          | Theoretical program time based on programs selected when the job order was started (seconds)                                        |
| stopReason                | Why the machine is idle (stop reason — entry should be mandatory)                                                                   |
| currentTemp               | Machine temperature                                                                                                                 |
| currentAlarmStatus        | `0` New · `1` Confirmed · `2` Cleared / no alarm                                                                                    |
| runningCompletionRatio    | Running job order completion ratio (percentage)                                                                                     |
| REQ_BATCHKEY              | Teleskop BATCHKEY of the last incoming request                                                                                      |
| REQ_JOBORDER              | Job order number of the last incoming request                                                                                       |
| REQ_RECIPEINDEX           | Position of the request's program within the job order                                                                              |
| REQ_REQORDERINDEX         | Order index of the last request. If `> -1` there is an active request; status is read from `REQ_STATUS`.                            |
| REQ_TANKNO                | Tank number of the last request                                                                                                     |
| REQ_PRIORITY              | Priority of the last request                                                                                                        |
| REQ_TOTALREQCOUNT         | Total request count in the job order of the last request                                                                            |
| REQ_PRGNO                 | Program number of the last request                                                                                                  |
| REQ_CMDNO                 | Command number of the last request                                                                                                  |
| REQ_STATUS                | Status of the last request: `0` new · `1` sent to dispenser · `2` dispensing started · `3` completed · `8` cancelled                |
| ConnectionStatus          | Device connection status: `0` Unknown · `1` Connected · `2` NotConnected · `3` Pending · `4` ConnectedDifferentRTC · `5` BatteryLow |

---

### BADATA

**Job order archive.** One row per job order run.

| Column                    | Description                                                                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BATCHKEY                  | Unique key for the job order                                                                                                                                                  |
| BATCHREFERENCE            | Batch reference                                                                                                                                                               |
| MACHINEID                 | → `BFMACHINES.MACHINEID`                                                                                                                                                      |
| MACHINECODE               | Machine name                                                                                                                                                                  |
| JOBORDER                  | Job order code. Set by the operator when starting, or by job order / recipe / ERP software. Unique codes are recommended but not required.                                    |
| STARTTIME                 | Job order start time                                                                                                                                                          |
| ENDTIME                   | Job order end time. If both `ENDTIME` and `CANCELTIME` are NULL the job order is still running. Finished job orders write to `ENDTIME`; cancelled ones write to `CANCELTIME`. |
| CANCELTIME                | Cancellation time. See `ENDTIME` note.                                                                                                                                        |
| PRGCOUNT                  | Theoretical program count in the job order                                                                                                                                    |
| PROGRAMNOLIST             | Comma-separated program numbers in the job order (e.g. `1101,2502,3502,2023,3076,4014`)                                                                                       |
| STOPREASON                | Is correction?                                                                                                                                                                |
| CORRECTIONCOUNT           | Correction count                                                                                                                                                              |
| CORRECTIONREASON          | Correction reason                                                                                                                                                             |
| OPRCODE                   | Operator number who started the job order                                                                                                                                     |
| CLIENTCODE                | Customer information                                                                                                                                                          |
| ARCHIVED                  | Job order has been transferred to the report database                                                                                                                         |
| THEORETICDURAT            | Theoretical duration of the job order **(seconds)**                                                                                                                           |
| REALDURATION              | Actual duration of the job order **(seconds)**. Updated when the job order ends or is cancelled.                                                                              |
| DEVIATION                 | Deviation between theoretical and actual duration                                                                                                                             |
| STOP_DURATION_OPER        | Operator-caused stop duration (seconds, written when job order ends) — total time the job order was paused                                                                    |
| STOP_DURATION_ALR         | Delays caused by command alarms in the job order (seconds, written when job order ends)                                                                                       |
| STOP_DURATION_WARNING_ALR | Delays caused by warning commands in the job order (seconds, written when job order ends)                                                                                     |
| ACTUAL_THEORETICDURAT     | Theoretical time based on running programs (seconds)                                                                                                                          |
| FABRIC_WEIGHT             | Weight (kg)                                                                                                                                                                   |
| CANCELDETAIL              | For cancelled job orders: `1` = included in production, `2` = not included. Default `1`.                                                                                      |
| theoricElectricity        | Theoretical electricity calculation was active when the job order started                                                                                                     |
| theoricWater              | Theoretical water calculation was active when the job order started                                                                                                           |
| theoricSteam              | Theoretical steam calculation was active when the job order started                                                                                                           |
| PARTCOUNT                 | Part count (requires relevant batch start parameter type definitions)                                                                                                         |
| PLANKEY                   | → `DYBFBATCHPLAN.PLANKEY` if the job order has a recipe in Dispensing Manager                                                                                                 |
| CUSTOMERNAME              | Customer name (requires relevant batch start parameter type definitions)                                                                                                      |
| PARTYNUMBER               | Party number (requires relevant batch start parameter type definitions)                                                                                                       |
| PLANNEDMACHINEID          | If the job order has a recipe (registered in Dispensing Manager), the originally planned machine ID                                                                           |

---

### BAACTUALPRGSTEPS

**Step / command execution records** within a job order. One row per command start.

| Column            | Description                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| BATCHKEY          | → `BADATA.BATCHKEY`                                                                                        |
| PRGNO             | Program number in which the command started                                                                |
| STEPNO            | Step number of the running command                                                                         |
| PARALLELSTEPNO    | Position of the command within the step (parallel index)                                                   |
| COMMANDNO         | Command number                                                                                             |
| STARTTIME         | Command start time                                                                                         |
| ENDTIME           | Command end time                                                                                           |
| THEORETICDURATION | Theoretical duration of the command **(seconds)**. Only meaningful when `PARALLELSTEPNO = 0`; otherwise 0. |
| PRGINDEX          | Position of the program within the job order                                                               |
| PHASENO           | Phase number. Only meaningful in Teleskop Washing mode.                                                    |
| PHASEINDEX        | Phase position within the washing program. Only meaningful in Teleskop Washing mode.                       |

---

### BABATCHPARAMETERS

**Batch start parameters** entered when starting a job order.

| Column           | Description                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| BATCHKEY         | → `BADATA.BATCHKEY`                                                                                                                             |
| BATCHPARAMETERID | Start parameter ID                                                                                                                              |
| PARAMSTRING      | Start parameter name                                                                                                                            |
| VALUE            | Start parameter value                                                                                                                           |
| PARAMETERTYPE    | Not used                                                                                                                                        |
| SELECTIONLIST    | Not used                                                                                                                                        |
| CHANGEDATE       | If the parameter changed while the job order was running, the time of the change. For values entered at job order start, equals the start time. |
| PROGNO           | If changed during the job order, the number of the program at the time of change. NULL for values entered at start.                             |
| PROGNAME         | If changed during the job order, the name of the program at the time of change. NULL for values entered at start.                               |

---

### BAALARM

**Alarms** that occurred while the job order was running.

| Column       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BATCHKEY     | → `BADATA.BATCHKEY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| BATCHALARMNO | Alarm sequence number within the job order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ALARMTYPE    | Alarm type: `0` Command time exceeded (causes stop), ALARMNO [100..199] · `1` Equipment alarm, ALARMNO [100..199] · `2` Warning alarm, ALARMNO [100..199] · `3` Warning command time exceeded, ALARMNO [100..199] · `4` Interlock alarm, ALARMNO [200..499] · `5` PLC alarm, ALARMNO [500..599] · `6` Software alarm, ALARMNO [600..699] · `7` Calibration alarm, ALARMNO [700..799] · `8` Coupled alarm, ALARMNO [800..899] · `9` Switched to manual mode, ALARMNO 5000 · `10` Job order stopped, ALARMNO 6000 · `12` System alarm in EPAC systems |
| PROGNO       | Program number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| COMMANDNO    | Command number that generated the alarm. `-1` when `ALARMTYPE >= 4`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| STARTTIME    | Alarm start time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CONFIRMTIME  | Time the alarm was confirmed by the operator                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ENDTIME      | Alarm end time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| EXPLANATION  | Alarm text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ISPARALLEL   | `1` parallel command · `2` main command. Meaningful only when `COMMANDNO != -1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| PRGINDEX     | Program position within the job order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| PHASENO      | Phase number at alarm. Only meaningful in Teleskop Washing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| PHASEINDEX   | Phase position within the program. Only meaningful in Teleskop Washing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

### BAINTERVENTION

**Operator interventions** during a job order run.

| Column        | Description                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INTERVENTKEY  | Unique key                                                                                                                                                                                                                                                                                                                                           |
| MACHINEID     | Machine number                                                                                                                                                                                                                                                                                                                                       |
| BATCHKEY      | → `BADATA.BATCHKEY`                                                                                                                                                                                                                                                                                                                                  |
| EVENTID       | Intervention type code: `52` command parameter value changed · `53` command IO changed · `63` main step added to job order · `64` main step deleted from job order · `65` parallel step added to job order · `66` parallel step deleted from job order · `70` job order changed (e.g. parameter value change) · `100` start button pressed on device |
| INTERVENTTIME | Intervention time                                                                                                                                                                                                                                                                                                                                    |
| P1            | Parameter 1                                                                                                                                                                                                                                                                                                                                          |
| P2            | Parameter 2                                                                                                                                                                                                                                                                                                                                          |
| P3            | Parameter 3                                                                                                                                                                                                                                                                                                                                          |
| EXPLANATION   | Intervention description                                                                                                                                                                                                                                                                                                                             |

---

### BAUSERACTIVITY

**Operator login records** (device sign-in events).

| Column       | Description                                    |
| ------------ | ---------------------------------------------- |
| ACTIVITYID   | Unique key                                     |
| MACHINEID    | ID of the machine where the operator logged in |
| USERID       | Operator ID                                    |
| USERNAME     | Operator first name                            |
| USERLASTNAME | Operator last name                             |
| ACTIVITYDATE | Login time                                     |

---

### BACONSUMPTION

**Job order consumption totals** (water, electricity, steam, salt). Records should be read **after the job order ends**.

| Column                 | Description                         |
| ---------------------- | ----------------------------------- |
| MACHINEID              | Machine number                      |
| BATCHKEY               | → `BADATA.BATCHKEY`                 |
| ELECTRICITY            | Electricity consumption             |
| ELECTRICITY_EXPORT     | Electricity (EXPORT) — not used     |
| ELECTRICITY_CAPACITIVE | Electricity (CAPACITIVE) — not used |
| ELECTRICITY_REACTIVE   | Electricity (REACTIVE) — not used   |
| STEAM                  | Steam consumption                   |
| WaterType1–WaterType6  | Water consumption by type (1–6)     |
| WaterTotal             | Total water consumption             |
| COUNTER1               | Custom counter 1                    |
| COUNTER2               | Custom counter 2                    |
| SALT                   | Salt consumption                    |

---

### DYBFBATCHPLAN

Job order recipe / plan table.

| Column            | Description                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PLANKEY           | Unique key                                                                                                                                                                        |
| RECORDTIME        | Record time                                                                                                                                                                       |
| JOBORDER          | Job order code                                                                                                                                                                    |
| MACHINEIDLIST     | Machine number entered when saving the job order                                                                                                                                  |
| PLANNEDMACHINE    | Planned machine                                                                                                                                                                   |
| ISCORRECTION      | Correction flag. Subsequent records with the same job order code are marked as corrections. When the job order starts, the record with the highest PLANKEY for that code is used. |
| CORRECTIONNUMBER  | Correction count                                                                                                                                                                  |
| SLAVEMACHINEID    | Slave machine ID for coupled (Master-Slave) runs                                                                                                                                  |
| ISCOUPLED         | Coupled run flag                                                                                                                                                                  |
| PRGCOUNT          | Program count in the job order                                                                                                                                                    |
| PROGRAMNOLIST     | Program numbers, separated by delimiter                                                                                                                                           |
| PLANNEDSTARTTIME  | Planned start time                                                                                                                                                                |
| OPERATORCODE      | Operator code                                                                                                                                                                     |
| CLIENTCODE        | Client code                                                                                                                                                                       |
| NOTE              | Note                                                                                                                                                                              |
| ISEXTERNAL        | Used when the job order is first transferred via database integration                                                                                                             |
| ISDELETED         | `1` = job order is deleted                                                                                                                                                        |
| STARTDATETIME     | Job order start time                                                                                                                                                              |
| STARTEDMACHINEID  | Machine where the job order was started                                                                                                                                           |
| lastForJoborder   | `1` for the most recently transferred job order with that code; `0` for others                                                                                                    |
| TheoricalDuration | Theoretical duration of the job order                                                                                                                                             |
| Color             | Job color                                                                                                                                                                         |
| sentToController  | Job order sent to controller flag                                                                                                                                                 |

---

### DYBFBATCHORDERRECIPEHEADER

Programs within a job order plan.

| Column     | Description                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| PLANKEY    | → `DYBFBATCHPLAN.PLANKEY`                                                                             |
| JOBORDER   | Job order code                                                                                        |
| RCPINDEX   | Program index within the job order. A program appears twice if it has both chemical and dye requests. |
| RECIPENO   | Program number                                                                                        |
| RECIPETYPE | Recipe type: `0` chemical · `1` dye                                                                   |

---

### DYBFBATCHORDERRECIPESTEPS

Chemical / dye request steps within a job order.

| Column           | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| PLANKEY          | Auto-increment                                                    |
| JOBORDER         | Job order code                                                    |
| RCPINDEX         | Program index within the job order                                |
| DYEREQUESTNUMBER | Request sequence in the job order                                 |
| MAINSTEP         | Request step                                                      |
| PARALLELSTEP     | Material sequence within a request step                           |
| RECIPETYPE       | Step type: `0` chemical · `1` dye                                 |
| CHEMCODE         | Material code                                                     |
| AMOUNT           | Material amount                                                   |
| AMOUNDUNIT       | Material unit (gr)                                                |
| REQNO_BATCH      | Request sequence within the job order                             |
| REQNO_PROG       | Request sequence within the program                               |
| otherUnit        | Unit used in ERP communication: `3` gr · `4` cc · `5` kg · `6` lt |

---

### BFMASTERCOMMANDS

Machine command definitions.

| Column           | Description                                         |
| ---------------- | --------------------------------------------------- |
| MACHINEID        | Machine number                                      |
| COMMANDNO        | Command number                                      |
| NAME             | Command name                                        |
| ACTIVATED        | `0` = command cannot be used in programs            |
| ADVICELIST       | Recommended parallel commands when writing programs |
| DONTUSELIST      | Commands that this command deactivates              |
| ISRUNMANUAL      | Can be run manually                                 |
| MOVEPARALLEL     | Move to next steps when written in parallel         |
| TBBCHANGETIME    | Change time                                         |
| ISDELETED        | Deleted flag                                        |
| ISCHANGED        | Changed flag                                        |
| X, Y, A, B, MAXA | Parameters for temperature-time chart calculation   |
| ISTEMPERATURE    | Affects temperature                                 |
| ISUNLOAD         | Unload command                                      |
| ICON             | Command icon                                        |
| GROUPID          | Command group                                       |

---

### BFCOMMANDPARAMETERS

Command parameter definitions.

| Column          | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| MACHINEID       | Machine number                                                              |
| COMMANDNO       | Command number                                                              |
| PARAMETERINDEX  | Parameter index                                                             |
| PARAMSTRING     | Parameter name                                                              |
| PROGRAMEDITING  | `1` = value is entered when writing a program (also implies NOT USEDEFAULT) |
| BATCHSTART      | `1` = parameter is determined at job order start                            |
| VALUE           | Default parameter value                                                     |
| PARAMETERTYPE   | `0` float · `1` selection list                                              |
| SELECTIONLIST   | Selection list texts (e.g. `"Dara Alma" "Dara Al"`)                         |
| SELECTIONVALUES | Selection list values (e.g. `"0" "1"`)                                      |
| UNITCODE        | Unit                                                                        |
| PARAMLOWLIMIT   | Lower input limit                                                           |
| PARAMHIGHLIMIT  | Upper input limit                                                           |
| TEMPERATURE     | Temperature                                                                 |
| USEDEFAULT      | `1` = not prompted when writing a program; default value is used            |
| TBBFORMUL       | Parameter value determined by a formula                                     |
| USEFORMULA      | Uses the general command formula for this parameter                         |

---

### DYTFDISPENSERSETTINGS

Dispenser list.

| Column                 | Description                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| DISPENSERID            | Dispenser ID                                                                                                         |
| NAME                   | Dispenser name                                                                                                       |
| DISPENSERTYPENO        | Dispenser type: `1` Liquid chemical · `2` Powder dye weighing · `3` Powder dissolving · `4` Powder chemical weighing |
| BDYREQUESTNAME         | Request file name                                                                                                    |
| BDYREQUESTPATH         | Request file path                                                                                                    |
| PROTOCOL               | Communication protocol between the dispenser and Teleskop                                                            |
| IP                     | Dispenser computer IP address                                                                                        |
| lastConsumptionControl | Last consumption zone check time from dispenser                                                                      |

---

### DYTFMATERIAL

Material (chemical / dye) definitions.

| Column        | Description                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MATERIALCODE  | Material code (unique)                                                                                                                                                            |
| MATERIALNAME  | Material name                                                                                                                                                                     |
| MADDEGRUPNO   | Material group: `1` chemical · `2` dye · `3` other                                                                                                                                |
| YOGUNLUK      | Density                                                                                                                                                                           |
| PH            | pH value                                                                                                                                                                          |
| BIRIMMALIYET  | Unit cost                                                                                                                                                                         |
| ReRequestable | If `1`, repeatable requests proceed for this material; otherwise they are cancelled. All materials in a multi-material request must be re-requestable for the request to proceed. |

---

### DYTACONSUMPTION

Chemical / dye consumption records.

| Column                | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| CONSUMPTIONNO         | Unique consumption number                                                                  |
| RECORDDATE            | Record time                                                                                |
| AMOUNT                | Consumption amount (mgr)                                                                   |
| ISMANUEL              | `1` = manual send (operator entered command on dispenser PC)                               |
| ADDITION              | Additional send flag                                                                       |
| CORRECTION            | Correction send flag                                                                       |
| SYSTEM                | Dispenser ID (→ `DISPENSERID`)                                                             |
| MACHINEID             | Machine that consumed · → `BFMACHINES.MACHINEID`                                           |
| ISTRANSFERRED         | Dispensing completed flag                                                                  |
| MATERIALCODE          | → `DYTFMATERIAL.MATERIALCODE`                                                              |
| JOBORDERCODE          | Job order code                                                                             |
| COST                  | Consumption cost                                                                           |
| WATER                 | Water amount sent with the material                                                        |
| RECIPEAMOUNT          | Recipe amount                                                                              |
| WEIGHINGSTARTTIME     | Dispensing start time                                                                      |
| programNo             | Program number                                                                             |
| programOrder          | Program order                                                                              |
| programReqOrder       | Request sequence within the program                                                        |
| lotNo                 | Material lot number                                                                        |
| DISPENSERID           | → `DYTFDISPENSERSETTINGS.DISPENSERID`                                                      |
| CALCULATEDCONSUMPTION | `1` = consumption auto-generated from recipe amount before receiving actual dispenser data |

---

## Frequently Asked Questions

### 1. Is the machine currently running or idle?

`TFMACHINESTATUS.RUNNING_JOBORDER` holds the running job order code. If empty or NULL, the machine is idle.

### 2. If idle, why?

`TFMACHINESTATUS.stopReason` holds the idle reason (stop reason entry should be mandatory).

### 3. If running — when did the job order start, and what programs/processes are running?

```sql
-- From TFMACHINESTATUS:
RUNNING_JOBORDER          -- running job order
RUNNING_JOBORDERSTARTTIME -- start time
RUNNING_PROGNOLIST        -- programs (e.g. "18,190,233")
RUNNING_THEOTIME          -- theoretical duration (seconds)
```

### 4. If switched to manual during a job order, why?

`TFMACHINESTATUS.RUNNING_AUTOMANSTATUS`: `-1` unknown · `0` automatic · `1` manual.
To list all manual mode periods for a running job order:

```sql
SELECT * FROM BAALARM
WHERE BATCHKEY = ? AND ALARMNO = 5000 AND ALARMTYPE = 9
ORDER BY BATCHALARMNO ASC
```

### 5. Who is the current operator on the machine?

`TFMACHINESTATUS.RUNNING_OPRNO` and `RUNNING_OPRNAME`.

### 6. When did the job order finish?

`BADATA`: if both `ENDTIME` and `CANCELTIME` are NULL, the job order is still running. `ENDTIME` is set on normal finish; `CANCELTIME` is set on cancellation.

### 6.1. Which programs were theoretically planned vs. actually ran?

`BADATA.PROGRAMNOLIST` holds the theoretical programs. `BAACTUALPRGSTEPS` holds the actual commands. Query by `BATCHKEY`, ordered by time. Filter `PARALLELSTEPNO = 0` to see main steps only.

### 6.2. How long was the machine in manual mode during this job order?

```sql
SELECT * FROM BAALARM
WHERE BATCHKEY = ? AND ALARMNO = 5000 AND ALARMTYPE = 9
ORDER BY BATCHALARMNO ASC
-- Sum ENDTIME - STARTTIME differences for total duration
```

### 6.3. List operator interventions.

Query `BAINTERVENTION` by `BATCHKEY`.

### 6.4. Operator interventions and their times.

Query `BAINTERVENTION` by `BATCHKEY` and `INTERVENTTIME`.

### 6.5. Warning command time-exceeded duration and responsible operator?

Filter `BAALARM` by `BATCHKEY` and `ALARMTYPE = 3`. Find the active user from `BAUSERACTIVITY` for the relevant machine at the time before the alarm:

```sql
SELECT TOP 1 * FROM BAUSERACTIVITY
WHERE MACHINEID = ? AND ACTIVITYDATE <= @alarmTime
ORDER BY ACTIVITYDATE DESC
```

### 6.6. Command time-exceeded durations and alarms (per program and step)?

Filter `BAALARM` by `BATCHKEY` and `ALARMTYPE = 0`. Join with `BAACTUALPRGSTEPS` on `BATCHKEY`, `PRGNO`, `COMMANDNO`, `STARTTIME`.

### 7. How many online requests were in a job order? How many succeeded / failed?

`DYBFBATCHPLAN` → find `PLANKEY` for the job order.
`DYBFBATCHORDERRECIPESTEPS` where `PARALLELSTEP = 1` → planned request count.
`DYTFCHEMREQUESTS` by `PLANKEY` → `STATUS`: `1` received · `2` dispensing started · `3` completed · `4` priority changed · `8` cancelled.
Count rows where `STATUS = 3` (unique by `RECIPEINDEX` + `RECIPESTEPNO`) = successful requests.

### 8. Alarm report (date, time, machine).

Interventions are in `BAINTERVENTION`; alarms are in `BAALARM`. To find the active user at the time:

```sql
SELECT TOP 1 * FROM BAUSERACTIVITY
WHERE MACHINEID = ? AND ACTIVITYDATE <= @eventTime
ORDER BY ACTIVITYDATE DESC
```

### 9. Program status — loaded to machine? Machine and Teleskop in sync?

`BFMASTERPRGHEADER.PRGSTATE`: `0` device only · `1` Teleskop only · `2` both sides.
If `PRGSTATE = 2` and `CHANGEDATE != TBBCHANGEDATE`, the copies differ.

### 10. Theoretical overflow time per program.

```sql
SELECT SUM([THEORETICDURATION])
FROM [dbo].[BFMASTERSTEPS]
WHERE MACHINEID = ? AND PROGNO = ? AND COMMANDNO IN (31, 32, 33)
-- Replace 31,32,33 with the relevant overflow command numbers
```

### 11. Actual overflow time per program.

Query `BAACTUALPRGSTEPS` by `BATCHKEY` and program number. Account for cases where a program is used multiple times in one job order.

### 12. Bath count per program — theoretical (fill / drain counts).

```sql
SELECT COUNT(COMMANDNO)
FROM BFMASTERSTEPS
WHERE MACHINEID = ? AND PROGNO = ? AND PARALELSTEP = 0 AND COMMANDNO IN (1, 2)
-- Replace 1,2 with fill command numbers; PARALELSTEP = 0 = main step only
-- MAINSTEP starts from 0
```

### 13. Bath count per program — actual.

Query `BAACTUALPRGSTEPS` by `BATCHKEY` and program number.

### 14. Theoretical program duration.

`BFMASTERPRGHEADER.DURATION` holds the theoretical program duration in **seconds**.
