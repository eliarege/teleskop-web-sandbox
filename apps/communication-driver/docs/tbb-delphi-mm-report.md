# MM Event Handler Database Operations Report

Based on the `Case TEventData(cnt.eventList[i]).EventCode Of` dispatch block in `untProcessThread.pas` (lines 445–693).

All tables are in the **Teleskop** database unless marked **[DmExchange]**.

---

## ALARM_CREATED

**Handler:** `DoALARM_CREATED` → `DB_INSERT_COMMAND_Alarm` / `DB_INSERT_PROCESS_Alarm` / `DB_INSERT_SYSTEM_Alarm` / `DB_INSERT_INTERLOCK_Alarm`
| Operation | Table |
|-----------|-------|
| INSERT | BAALARM |
| UPDATE | TFMACHINESTATUS |

---

## ALARM_CONFIRMED

**Handler:** `DoALARM_CONFIRMED` → `DB_CONFIRM_COMMAND_Alarm` / `DB_CONFIRM_PROCESS_Alarm` / `DB_CONFIRM_SYSTEM_Alarm` / `DB_CONFIRM_INTERLOCK_Alarm`
| Operation | Table |
|-----------|-------|
| UPDATE | BAALARM (CONFIRMTIME, CONFIRMOPERATORID) |
| UPDATE | TFMACHINESTATUS |

---

## ALARM_CLEARED

**Handler:** `DoALARM_CLEARED` → `DB_CLEAR_COMMAND_Alarm` / `DB_CLEAR_PROCESS_Alarm` / `DB_CLEAR_SYSTEM_Alarm` / `DB_CLEAR_INTERLOCK_Alarm`
| Operation | Table |
|-----------|-------|
| UPDATE | BAALARM (ENDTIME) |
| UPDATE | TFMACHINESTATUS |

---

## LOCKS_ACTIVE / LOCKS_DEACTIVE

**Handler:** `DoLOCKS_ACTIVE` / `DoLOCKS_DEACTIVE`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## BATCH_FINISHED

**Handler:** `DoBATCH_FINISHED` → `DB_FixCmdAlrEndTimes`, `DB_BatchFinished`, `DB_INSERT_batchFinishConfirmed`, `DB_Integration_BatchFinished`, `finisAllContinuousCommandTimeOutReasons`, `calculateTheoreticalWaterConsumption`, `insertPT_Changes`, `insertJoborderNote`, `insertBatchHistory`
| Operation | Table |
|-----------|-------|
| UPDATE | BADATA (ENDTIME, REALDURATION, THEORETICDURAT, stop durations, etc.) |
| UPDATE | BAALARM (ENDTIME for all open alarms) |
| UPDATE | BAACTUALPRGSTEPS (ENDTIME for all open steps) |
| UPDATE | BACONSUMPTION (theoretical water, steam, electricity totals) |
| UPDATE | BACOMMANDTIMEOUTREASONS (ENDTIME for open reasons) |
| UPDATE | TFMACHINESTATUS |
| INSERT | PTBATCHARCHIVECHANGED |
| INSERT | PTBATCHNOTES |
| INSERT | Dyelot_History **[DmExchange]** |
| UPDATE | Dyelots (endState=1, EndConfirm=1, EndTime, RunTime, etc.) **[DmExchange]** |
| UPDATE | COMMANDTIMEOUTREASONS (ENDTIME) **[DmExchange]** |
| SELECT | BAALARM, BAACTUALPRGSTEPS, BADATA, BACONSUMPTION |

---

## BATCH_FINISH_CONFIRMED

**Handler:** `DoBATCH_FINISH_CONFIRMED` → `DB_INSERT_batchFinishConfirmed`
| Operation | Table |
|-----------|-------|
| UPDATE | BADATA (ENDTIME finalized) |
| UPDATE | BAALARM (close open alarms) |
| UPDATE | BAACTUALPRGSTEPS (close open steps) |
| INSERT | PTBATCHARCHIVECHANGED |
| UPDATE | TFMACHINESTATUS |
| UPDATE | Dyelots **[DmExchange]** |

---

## BATCH_STOPPED

**Handler:** `DoBATCH_STOPPED` → `DB_insertPauseMode`
| Operation | Table |
|-----------|-------|
| INSERT | BASTOPS |
| UPDATE | BADATA (batch status) |
| UPDATE | TFMACHINESTATUS |
| INSERT | Dyelot_History **[DmExchange]** |

---

## BATCH_CANCELED

**Handler:** `DoBATCH_CANCELED` → `DB_FixCmdAlrEndTimes`, `DB_BatchCancelled`, `DB_updatePauseMode`, `DB_INSERT_batchFinishConfirmed`, `DB_Integration_BatchFinished`, `finisAllContinuousCommandTimeOutReasons`, `calculateTheoreticalWaterConsumption`, `insertPT_Changes`, `insertJoborderNote`, `insertBatchHistory`
| Operation | Table |
|-----------|-------|
| UPDATE | BADATA (CANCELTIME) |
| UPDATE | BAALARM (ENDTIME for all open alarms) |
| UPDATE | BAACTUALPRGSTEPS (ENDTIME for all open steps) |
| UPDATE | BACONSUMPTION (theoretical water) |
| UPDATE | BACOMMANDTIMEOUTREASONS (ENDTIME) |
| UPDATE | TFMACHINESTATUS |
| INSERT | PTBATCHARCHIVECHANGED |
| INSERT | PTBATCHNOTES |
| INSERT | Dyelot_History **[DmExchange]** |
| UPDATE | Dyelots (endState=1, EndTime, etc.) **[DmExchange]** |
| UPDATE | COMMANDTIMEOUTREASONS (ENDTIME) **[DmExchange]** |

---

## BATCH_CONTINUE

**Handler:** `DoBATCH_CONTINUE` → `DB_updatePauseMode`
| Operation | Table |
|-----------|-------|
| UPDATE | BASTOPS (close open stop) |
| UPDATE | BADATA (batch status) |
| UPDATE | TFMACHINESTATUS |
| INSERT | Dyelot_History **[DmExchange]** |

---

## COMMAND_STARTED

**Handler:** `DoCOMMAND_STARTED` → `DB_INSERT_Command`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BAACTUALPRGSTEPS |
| UPDATE | TFMACHINESTATUS |
| UPDATE | TFMACHINESTATUS (lastBatchEvent) |
| SELECT | BFMASTERPRGHEADER, BFMASTERCOMMANDS (program/command name lookup) |

---

## COMMAND_FINISHED

**Handler:** `DoCOMMAND_FINISHED` → `DB_UPDATE_Command`
| Operation | Table |
|-----------|-------|
| UPDATE | BAACTUALPRGSTEPS (ENDTIME) |
| UPDATE | TFMACHINESTATUS |

---

## PROGRAM_CHANGED

**Handler:** `DoPROGRAM_CHANGED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## COMMAND_CHANGED / NEW_COMMAND_DEFINED / COMMAND_DELETED

**Handlers:** `DoCOMMAND_CHANGED`, `DoNEW_COMMAND_DEFINED`, `DoCOMMAND_DELETED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## CALIBRATION_CHANGED / FUNCTION_CHANGED / PARAMETER_CHANGED

**Handlers:** `DoCALIBRATION_CHANGED`, `DoFUNCTION_CHANGED`, `DoPARAMETER_CHANGED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## MASTER_MODE_STARTED / MASTER_MODE_FINISHED / SLAVE_MODE_STARTED / SLAVE_MODE_FINISHED / SINGLE_MODE_STARTED / SINGLE_MODE_FINISHED / MANUEL_MODE_STARTED / MANUEL_MODE_FINISHED / MANUEL_MODE_STRING

| Operation | Table           |
| --------- | --------------- |
| UPDATE    | TFMACHINESTATUS |

---

## RUNNING_PROGRAM_CHANGED

**Handler:** `DoRUNNING_PROGRAM_CHANGED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |
| UPDATE | BFMASTERPRGHEADER (program state) |

---

## USER_FILE_CHANGED

**Handler:** `DoUSER_FILE_CHANGED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## NEW_BATCH_PARAMETER / BATCH_PARAMETER_CHANGED / BATCH_PARAMETER_DELETED

**Handler:** `DoNEW_BATCH_PARAMETER`, `DoBATCH_PARAMETER_CHANGED`, `DoBATCH_PARAMETER_DELETED`
(also dispatched via `doBatchHeaderChanged` → `insertNewBatchParameters`)
| Operation | Table |
|-----------|-------|
| INSERT | BABATCHPARAMETERS |
| UPDATE | TFMACHINESTATUS |

---

## PROGRAM_CREATED / PROGRAM_DELETED

**Handlers:** `DoPROGRAM_CREATED`, `DoPROGRAM_DELETED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## IO_ADDED / IO_DELETED

**Handlers:** `DoIO_ADDED`, `DoIO_DELETED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## TIME_DATE_CHANGED

**Handler:** `DoTIME_DATE_CHANGED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## MACHINE_PARAMETER_ADDED / MACHINE_PARAMETER_DELETED / MACHINE_PARAMETER_CHANGED

| Operation | Table           |
| --------- | --------------- |
| UPDATE    | TFMACHINESTATUS |

---

## MANUEL_REASON_FILE_UPDATE / ENDING_REASON_FILE_UPDATE

| Operation | Table           |
| --------- | --------------- |
| UPDATE    | TFMACHINESTATUS |

---

## RUN_TIME_IO_CHANGED

**Handler:** `DoRUN_TIME_IO_CHANGED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## TBB6500_RESTARTED

**Handler:** `DoTBB6500_RESTARTED`
| Operation | Table |
|-----------|-------|
| UPDATE | BADATA (CANCELTIME for any open batch) |
| UPDATE | TFMACHINESTATUS |

---

## TBB_POWER_DOWN

**Handler:** `DoTBB_POWER_DOWN`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## IO_VALUE_CHANGED

**Handler:** `DoIO_VALUE_CHANGED`
| Operation | Table |
|-----------|-------|
| INSERT | BAIOVALUES_CURRENT |

---

## DIO_VALUE_CHANGED

**Handler:** `DoDIO_VALUE_CHANGED`
| Operation | Table |
|-----------|-------|
| INSERT | BADIOVALUES_CURRENT |

---

## VIRTUAL_INPUT_VALUE_CHANGED

**Handler:** `DoVIN_VALUE_CHANGED`
| Operation | Table |
|-----------|-------|
| INSERT | BAVINVALUES_CURRENT |

---

## TBB_CYCLE_TIME

**Handler:** `DoTBB_CYCLE_TIME`
| Operation | Table |
|-----------|-------|
| INSERT | BACYCLETIMES |
| INSERT | BACYCLETIMES_CURRENT |

---

## CONSUMPTION_FLOWMETER

**Handler:** `DoCONSUMPTION_FLOWMETER`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BACONSUMPTION (water flow totals) |
| UPDATE | TFMACHINESTATUS |

---

## CONSUMPTION_FLOWMETER_MINUTELY

**Handler:** `DoCONSUMPTION_FLOWMETER_MINUTELY`
| Operation | Table |
|-----------|-------|
| INSERT | BACONSUMPTIONTIMESTAMP |
| UPDATE | TFMACHINESTATUS |

---

## CONSUMPTION_STEAM_CURRENT

**Handler:** `DoCONSUMPTION_STEAM_CURRENT`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS (conSteam, conSteamLast) |

---

## CONSUMPTION_ELECTRICITY_BATCH

**Handler:** `DoCONSUMPTION_ELECTRICITY`
| Operation | Table |
|-----------|-------|
| UPDATE | BACONSUMPTION (ELECTRICITY, ELECTRICITY_REACTIVE, ELECTRICITY_CAPACITIVE) |
| UPDATE | TFMACHINESTATUS (conElectricity, conElectricityLast) |

---

## CONSUMPTION_STEAM_THEORETIC_BATCH

**Handler:** `DoCONSUMPTION_STEAM_THEORETIC_BATCH`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BACONSUMPTION (STEAM) |

---

## RUN_TIME_SP_CHANGED

**Handler:** `DoRUN_TIME_SP_CHANGED`
| Operation | Table |
|-----------|-------|
| INSERT | BASETPOINTCHANGES |

---

## RUNTIME_NEW_MAINSTEP_ADDED / RUNTIME_MAINSTEP_REMOVED

**Handlers:** `DoRUNTIME_NEW_MAINSTEP_ADDED`, `DoRUNTIME_MAINSTEP_REMOVED`
| Operation | Table |
|-----------|-------|
| INSERT | BASTEPCHANGES |
| UPDATE | TFMACHINESTATUS |

---

## RUNTIME_NEW_PARALLELSTEP_ADDED / RUNTIME_PARALLELSTEP_REMOVED

**Handlers:** `DoRUNTIME_NEW_PARALLELSTEP_ADDED`, `DoRUNTIME_PARALLELSTEP_REMOVED`
| Operation | Table |
|-----------|-------|
| INSERT | BASTEPCHANGES |
| UPDATE | TFMACHINESTATUS |

---

## COMMAND_STARTED_AI_VALUE

**Handler:** `DoCOMMAND_STARTED_AI_VALUE`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BAAIVALUES |

---

## COMMAND_FINISHED_AI_VALUE

**Handler:** `DoCOMMAND_FINISHED_AI_VALUE`
| Operation | Table |
|-----------|-------|
| UPDATE | BAAIVALUES |

---

## START_BUTTON_PRESSED

**Handler:** `DoSTART_BUTTON_PRESSED`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## STOP_REASON

**Handler:** `DoSTOP_REASON`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |
| UPDATE | BASTOPS (stop reason) |

---

## CONSUMPTION_STEAM_THEORETIC_PROGRAM

**Handler:** `DoCONSUMPTION_STEAM_THEORETIC_PROGRAM`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BACONSUMPTIONPROGRAM (STEAM) |

---

## CONSUMPTION_ELECTRICITY_PROGRAM

**Handler:** `DoCONSUMPTION_ELECTRICITY_PROGRAM`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BACONSUMPTIONPROGRAM (ELECTRICITY, ELECTRICITY_REACTIVE, ELECTRICITY_CAPACITIVE) |

---

## CONSUMPTION_FLOWMETER_PROGRAM

**Handler:** `DoCONSUMPTION_FLOWMETER_PROGRAM`
| Operation | Table |
|-----------|-------|
| INSERT or UPDATE | BACONSUMPTIONPROGRAM (water flow per program) |

---

## CONSUMPTION_LIQUIT_SALT_BATCH

**Handler:** `DoCONSUMPTION_LIQUIT_SALT_BATCH`
| Operation | Table |
|-----------|-------|
| UPDATE | BACONSUMPTION (SALT) |

---

## CONSUMPTION_LIQUIT_SALT_PROGRAM

**Handler:** `DoCONSUMPTION_LIQUIT_SALT_PROGRAM`
| Operation | Table |
|-----------|-------|
| UPDATE | BACONSUMPTIONPROGRAM (SALT) |

---

## BATCHHEADERCHANGED

**Handler:** `doBatchHeaderChanged` → `insertNewBatchParameters`
| Operation | Table |
|-----------|-------|
| INSERT | BABATCHPARAMETERS |

---

## CONSUMPTION_ELECTRICITY_CURRENT

**Handler:** `DoCONSUMPTION_ELECTRICITY_CURRENT`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS (conReadDate, conElectricity, conElectricityLast, conWater1/2) |

---

## REQUEST_BATCH_DOWNLOAD

**Handler:** `DoREQUEST_BATCH_DOWNLOAD`
| Operation | Table |
|-----------|-------|
| UPDATE | BFMACHINES (BATCHNO, BATCHDOWNLOADSTATUS, BATCHDOWNLOADSTATUSCHANGETIME) |
| UPDATE | TFMACHINESTATUS |

---

## USER_CHANGED

**Handler:** `DoUSER_CHANGED`
| Operation | Table |
|-----------|-------|
| INSERT | BAUSERACTIVITY |
| UPDATE | TFMACHINESTATUS |

---

## REQUEST_BATCH_START

**Handler:** `DoREQUEST_BATCH_START`
| Operation | Table |
|-----------|-------|
| INSERT | BAINTERVENTION_BEFORESTART (if batch cannot start) |
| SELECT | DYBFBATCHPLAN, PTBATCHPLANQUEUE, BFMACHINES, Dyelots **[DmExchange]** |
| UPDATE | TFMACHINESTATUS |

---

## CALCULATED_VALUE_CHANGED

**Handler:** `DoCALCULATED_VALUE_CHANGED` → `insertCalculatedValue`
| Operation | Table |
|-----------|-------|
| INSERT | BACALCULATEDVALUES |

---

## DAILY_WATER_CONSUMPTION

**Handler:** `DoDAILY_WATER_CONSUMPTION` → `dailyWaterConsumption`
| Operation | Table |
|-----------|-------|
| INSERT | BADAILYWATERCONSUMPTION |

---

## STEP_SKIPPING_REASON_SELECTED

**Handler:** `DoSTEP_SKIPPING_REASON_SELECTED` → `stepSkippingReasonSelected`
| Operation | Table |
|-----------|-------|
| INSERT | BASTEPSKIPPINGREASONS |

---

## ILAVE_STARTED

**Handler:** `DoIlaveIslemler`
| Operation | Table |
|-----------|-------|
| INSERT | BAINTERVENTION |
| UPDATE | BADATA (ADDITIONSTARTED = 1) |

---

## ILAVE_CANCELLED / ILAVE_COMPLETED

**Handler:** `DoIlaveIslemler`
| Operation | Table |
|-----------|-------|
| INSERT | BAINTERVENTION |
| UPDATE | TFMACHINESTATUS |

---

## BATCH_FINISH_REASON_UPDATED

**Handler:** `DoBATCH_FINISH_REASON_UPDATED` → `UpdateBatchFinishReason`
| Operation | Table |
|-----------|-------|
| UPDATE | BADATA (FINISHREASONID) |

---

## MANUAL_COMMAND_RUN_START

**Handler:** `DoMANUAL_COMMAND_RUN_START`
| Operation | Table |
|-----------|-------|
| INSERT | BAINTERVENTION |
| UPDATE | TFMACHINESTATUS |

---

## MANUAL_COMMAND_RUN_FINISH

**Handler:** `DoMANUAL_COMMAND_RUN_FINISH`
| Operation | Table |
|-----------|-------|
| INSERT | BAINTERVENTION |
| UPDATE | TFMACHINESTATUS |

---

## MANUEL_MEASURED_PROCESS_VALUE

**Handler:** `DoMANUEL_MEASURED_PROCESS_VALUE`
| Operation | Table |
|-----------|-------|
| INSERT | BAMANUELMEASUREDPROCESSVALUES |

---

## BATCH_LOADED

**Handler:** `DoBATCH_LOADED`
| Operation | Table |
|-----------|-------|
| INSERT | BAINTERVENTION_BEFORESTART (pre-start intervention recording) |
| DELETE | BAINTERVENTION_BEFORESTART (via `DB_DELETE_InvertionBeforestart` on start) |
| UPDATE | TFMACHINESTATUS |

---

## LOADED_BATCH_CANCELED

**Handler:** `DoLOADED_BATCH_CANCELED`
| Operation | Table |
|-----------|-------|
| DELETE | BAINTERVENTION_BEFORESTART |
| UPDATE | TFMACHINESTATUS |

---

## GLG_PAGE_ACTIVE / GLG_PAGE_PASSIVE / PF_HAPPEND_GLG_ACTIVE / MIT_GLG_PAGE_ACTIVE / MIT_GLG_PAGE_PASSIVE / MIT_PF_HAPPEND_GLG_ACTIVE

**Handler:** `DoGLG_Action`
| Operation | Table |
|-----------|-------|
| UPDATE | TFMACHINESTATUS |

---

## TIME_EXCEEDED_ALARM_REASON_SELECTED

**Handler:** `DO_TIME_EXCEEDED_ALARM_REASON_SELECTED` → `DB_TIME_EXCEEDED_ALARM_REASON_SELECTED`
| Operation | Table |
|-----------|-------|
| INSERT | BACOMMANDTIMEOUTREASONS |
| UPDATE | BACOMMANDTIMEOUTREASONS (ENDTIME, close previous open reason) |
| INSERT | COMMANDTIMEOUTREASONS **[DmExchange]** |
| UPDATE | COMMANDTIMEOUTREASONS (ENDTIME) **[DmExchange]** |

---

## TIME_EXCEEDED_ALARM_STOP

**Handler:** `DO_TIME_EXCEEDED_ALARM_STOP` → `DB_TIME_EXCEEDED_ALARM_STOP`
| Operation | Table |
|-----------|-------|
| UPDATE | BACOMMANDTIMEOUTREASONS (ENDTIME) |
| UPDATE | COMMANDTIMEOUTREASONS (ENDTIME) **[DmExchange]** |

---

## RECALCULATED_SALT_VALUE_RATIO_EVT

**Handler:** `DO_RECALCULATED_SALT_VALUE_RATIO_EVT` → `DB_RECALCULATED_SALT_VALUE_RATIO_EVT`
| Operation | Table |
|-----------|-------|
| UPDATE | DYBFBATCHORDERRECIPESTEPS (AMOUNT, RECIPEAMOUNT — salt ratio recalculation) |
| INSERT | BAINTERVENTION |
| INSERT | DYBFBATCHORDERRECIPESTEPLOGS |

---

## Every Event (always executed after dispatch)

| Operation     | Table                                | Condition                                              |
| ------------- | ------------------------------------ | ------------------------------------------------------ |
| UPDATE        | TFMACHINESTATUS                      | Always after each event loop iteration                 |
| UPDATE        | BFMACHINES (LASTEVENTPROCESSID/DATE) | When `TFMACHINESTATUS` via `DB_SaveLastProcessedEvent` |
| INSERT/UPDATE | BFMACHINES (online req state)        | Via `updateOnlineReqState` when not synchronizing      |

---

# DataType 1 — `TMaterialRequestEventData`

## CHEMICAL_REQUEST_EVENT

**Handler:** `DoCHEMICAL_REQUEST_EVENT` → `DB_INSERT_ChemicalRequest`, optionally `WriteRequestStringToDatabase`
| Operation | Table |
|-----------|-------|
| SELECT | BADATA (validate batchkey exists) |
| INSERT | BACHEMICALREQUEST |
| INSERT | BACHEMICALREQUESTSTRINGS (only when `SysConfig.storeRequestsInDatabase = True`) |
| UPDATE | TFMACHINESTATUS |

> When `SysConfig.storeRequestsInDatabase` is False the request string is written to the `6500.req` file on the file system instead of BACHEMICALREQUESTSTRINGS.

---

# DataType 2 — `TBatchStartEventData`

## BATCH_STARTED

**Handler:** `DoBATCH_STARTED` → `DB_INSERT_BatchHeader`, plus multiple supporting calls
| Operation | Table |
|-----------|-------|
| SELECT | BADATA (duplicate-start guard) |
| SELECT | DYBFBATCHPLAN, PTBATCHPLANQUEUE (planned machine lookup) **[DmExchange]** |
| UPDATE | BADATA (fix CANCELTIME on previously killed batch with STOPREASON=-58) |
| UPDATE | BADATA (cancel last continuous open batch via `cancelLastContinuousBatch`) |
| UPDATE | BABATCHADDITIONS (close any open additions via `finishBatchAddition`) |
| INSERT | BADATA (new batch row — BATCHKEY, JOBORDER, STARTTIME, PROGRAMNOLIST, THEORETICDURAT, FABRIC_WEIGHT, etc.) |
| INSERT | BABATCHPARAMETERS (batch start parameters, one row per parameter) |
| UPDATE | BADATA (PLANNEDMACHINEID, if batch was in plan) |
| UPDATE | BADATA (STOPREASON from previous stop via `DB_updateStopReason`) |
| INSERT | PTBATCHARCHIVECHANGED (via `insertPT_Changes` / `insertPT_ChangesPlan`, when `SysConfig.ptActive`) |
| DELETE | PTBATCHPLANQUEUE (remove from queue via `deleteFromPlanQueue`, when `SysConfig.ptActive` and not time-based) |
| INSERT | PTBATCHNOTES (job-order note via `insertJoborderNote`, when `SysConfig.ptActive`) |
| UPDATE | Dyelots (color assignment via `setColor`) **[DmExchange]** |
| INSERT | Dyelot_History (via `insertBatchHistory`, when `SysConfig.bIntegrationBatchHistory`) **[DmExchange]** |
| INSERT | BAINTERVENTION (migrated from BAINTERVENTION_BEFORESTART via `DB_MIGRATE_InterventionBeforestart`) |
| DELETE | BAINTERVENTION_BEFORESTART (after migration) |
| DELETE | BAOPTIMIZEDPARAMETERVALUES_TEMP (via `DB_DELETE_OptimizedParameterValuesFromTempTable`) |
| INSERT/UPDATE | BAOPTIMIZEDPARAMETERVALUES (via `DB_MIGRATE_OptimizedParameterValues`, if last uploaded batch matches) |
| UPDATE | TFMACHINESTATUS |

> Also writes a `.act` file to `SysConfig.sStartEndPath` (and optionally `sStartEndPathERP`) on the file system.

---

# DataType 3 — `TKillCurrentStatusEventData`

## KILL_ACTIVEBATCHSTATUS

**Handler:** `DoKILL_ACTIVEBATCHSTATUS` → `DB_KillEmAll`

Forcibly closes all open batch data for a controller (used on abnormal shutdown / reconnect).

| Operation | Table                                                                   |
| --------- | ----------------------------------------------------------------------- |
| UPDATE    | BAACTUALPRGSTEPS (ENDTIME for all open steps)                           |
| UPDATE    | BAALARM (ENDTIME for all open alarms)                                   |
| UPDATE    | BADATA (CANCELTIME, STOPREASON=-58 for all open batches on the machine) |
| UPDATE    | TFMACHINESTATUS                                                         |

> Also triggers `DB_zipArchiveFiles` which archives batch log files on the file system.

---

# DataType 4 — `TMaterialRequestStatusData`

## MATERIAL_REQUEST_STATUS_EVENT

**Handler:** `DoMATERIAL_REQUEST_STATUS_EVENT`

Updates the in-memory chemical request status; no separate table write beyond the machine state.

| Operation | Table                                                         |
| --------- | ------------------------------------------------------------- |
| UPDATE    | TFMACHINESTATUS (reflects updated `OnlineChemReqData.Status`) |

---

# DataType 5 — `TPVEventData`

## PV_EVENT

**Handler:** `DoPV_EVENT` → `DB_INSERT_PVValue`

Records a process-variable (PV) reading captured at command start/finish.

| Operation | Table                                                      |
| --------- | ---------------------------------------------------------- |
| INSERT    | BAPVVALUES (historical PV log)                             |
| INSERT    | BAPVVALUES_CURRENT (latest PV reading per machine/command) |
