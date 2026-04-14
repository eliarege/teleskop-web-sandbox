# Integration Database Description for ERP

_v4 - 18.07.2024_

Eliar uses a common MS SQL Server database to integrate with ERP systems. In summary, the integration process works like this:
- All the production data will be written by ERP system to the integration database.
- Eliar Integration Service (EIS) reads the production data and imports them into the production database of Eliar if there is no problem with the data.
  - EIS marks the data as problematic if the data has any mistake.
- After importing production data, the batches are ready to run in dyeing/washing machines.
- Eliar writes some information during the batch is running like started, finished etc.
- We send detailed information like consumptions or durations after the batch completed.

## Tables and Descriptions

### Operator

Operator list of dyeing, washing and drying machines.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| OperatorID | Operator Number | Eliar | Int | |
| OperatorName | Operator Name | Eliar | varchar(50) | |
| OperatorGroup | For future Use | - | smallint | - |

### Machines

Machine list defined in Teleskop - Machines application. Eliar will edit/insert/delete from this table when a machine is edited/inserted or deleted from Eliar software.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| MachineNo | Machine number | Eliar | varchar(4) | |
| MachineName | Machine name | Eliar | varchar(20) | |
| MGroupNo | Machine group number | Eliar | smallint | |
| MinVolume | Minimum fill quantity in liter | Eliar | real | |
| MaxVolume | Maximum fill quantity in liter | Eliar | real | |
| MinWeight | Minimum batch weight in Kg | Eliar | real | |
| MaxWeight | Maximum batch weight in Kg | Eliar | real | |
| ImportState | State of the machine (record): Eliar sets to 1 if a machine is added or edited (new or updated machine). ERP sets to 10 when it reads the updated/inserted machine info (ERP read successfully). Eliar sets to 30 if the machine is deleted from Eliar database (should be deleted by ERP from its database). ERP sets to 40 when deleted. | Eliar / ERP | smallint | |

### Machine_Groups

Eliar writes machine group to this table.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| MGroupNo | Machine group number | Eliar | smallint | |
| MGroupName | Machine group name | Eliar | varchar(20) | |
| ImportState | 1: to update, 10: imported without problems, 30: to delete, 40: deleted without problems | Eliar / ERP | smallint | |

### Treatments

Treatments (programs) are written to this table. When a Teleskop operator writes, deletes or edits a program by using Eliar Program Editor, the changes will be written to this table. (ERP reads)

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| TreatmentNo | Treatment number | Eliar | Int | |
| TreatmentGroupNo | Treatment group | Eliar | smallint | |
| TreatmentName | Treatment name | Eliar | varchar(40) | |
| TreatmentParaCount | Number of parameters | Eliar | smallint | |
| TreatmentType | 1 = single program (treatment), 2 = ordered program (treatment). Not used. | Eliar | smallint | |
| ImportState | 1 = to update, 10 = imported without problems, 30 = to delete, 40 = deleted without problems | Eliar / ERP | smallint | |

### Treatments_MGroups

This table stores relations between Treatments and Machine_Groups.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | - | int | YES |
| TreatmentNo | Treatment number | Eliar | int | |
| MGroupNo | Machine group | Eliar | smallint | |
| ImportState | 1: to update, 10: imported without problems, 30: to delete, 40: deleted without problems | Eliar / ERP | smallint | |

### Treatment_Groups

Contains treatment (program) group information. (Currently only one treatment group exists.)

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| TreatmentGroupNo | Treatment group number | Eliar | smallint | |
| TreatmentGroupName | Treatment group name | Eliar | varchar(30) | |
| ImportState | 1 = to update, 10 = imported without problems, 30 = to delete, 40 = deleted without problems | Eliar / ERP | smallint | |

### Treatment_Parameter

Parameter list that can be optimized. The table is populated by Eliar when "Command Optimization Parameters" are changed using Machines application.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| TreatmentParaNo | Parameter number | Eliar | smallint | |
| TreatmentParaName | Parameter name | Eliar | varchar(40) | |
| TreatmentParaMin | Minimum value | Eliar | real | |
| TreatmentParaMax | Maximum value | Eliar | real | |
| TreatmentParaUnit | Unit | Eliar | varchar(10) | |
| ImportState | 1 = to update, 10 = imported without problems, 30 = to delete, 40 = deleted without problems | Eliar / ERP | smallint | |

### Treatment_Parameter_Ref

References of treatment parameters. This table has detailed explanation in Command Parameter Optimization document. (Eliar inserts, ERP reads)

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Auto | int | YES |
| TreatmentNo | Treatment number | Eliar | int | |
| TreatmentParaCounter | Sequential parameter number | Eliar | smallint | |
| TreatmentParaNo | Parameter number | Eliar | smallint | |
| ImportState | 1 = to update, 10 = imported without problems, 30 = to delete, 40 = deleted without problems | Eliar / ERP | smallint | |

### Product

Contains chemical/dyestuff product (material) information.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| ID | Auto increment | Auto | int | |
| ShortName | Unique product short name – displayed on Teleskop | ERP | varchar(20) | |
| Name | Unique product name – same as "ShortName" field | ERP | varchar(80) | |
| KindOfProduct | 1: dyestuff, 2: chemical | ERP | smallint | |
| ExternalProductID | External unique identifier for the product on the ERP side. Used because names may be modified so names alone can't ensure the product is found for updates. For chemicals e.g. C3045, for dyes e.g. D1234. | ERP | varchar(24) | |
| ImportState | 1 = to update (ERP writes when a new product is defined), 10 = imported without problems, 30 = to delete (ERP writes when a new product is deleted), 40 = deleted without problems | ERP / Eliar | smallint | |
| DyehouseNumber | Separate products for companies with more than one dyehouse/laundry. Default -1. | ERP | Int | |

### Dyelots

This is the header table for the recipe.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | System | int | |
| DyelotRefNo | Batch reference number | ERP | varchar(6) | YES |
| Dyelot | Batch code (recipe code). The code operator will use in Eliar controller to start recipe. ERP software should delete old records from [Dyelots, Dyelot_Recipe, Dyelot_Procedure, Dyelot_Parameter] tables and insert new records when reusing batch codes. | ERP | varchar(20) | NO |
| ExternalDyelot | Batch code reference for ERP | ERP | varchar(20) | YES |
| ReDye | Redye number. 0 for first process. | ERP | smallint | |
| Machine | Machine number | ERP | varchar(4) | NO |
| Color | COLORREF-RGB value for batch color display | ERP | int | YES |
| State | Batch State: 0 = Not scheduled (waiting for read), 10 = Scheduled after import, 30 = Active (running), 40 = Finished | Eliar | smallint | |
| ImportState | Import State (see "Important Notes" section): 1 = has to be imported (ERP writes, Eliar reads), 10 = imported without problems (Eliar writes), 30 = to delete (ERP writes, Eliar reads), 40 = deleted without problems (Eliar writes), 50 = An error occurred while importing (Eliar writes) | ERP / Eliar | smallint | NO |
| StartTime | Start time | Eliar | TIMESTAMP | |
| EndTime | End time | Eliar | TIMESTAMP | |
| OrderNo | Order code - Order Number | ERP | varchar(20) | |
| Customer | Customer | ERP | varchar(20) | |
| Article | Article | ERP | varchar(20) | |
| RecipeNo | Recipe number | ERP | varchar(50) | |
| [Text1... Text5] | Text parameters to send to Eliar | ERP | varchar(20) | |
| Weight | Batch weight (best in unit "kg") | ERP | real | |
| LiquorRatio | Liquor ratio (best in unit "l/kg") | ERP | real | |
| LiquorQuantity | Liquor quantity (best in unit "l") | ERP | real | |
| [Parameter1...Parameter50] | Numeric parameters to send to Eliar | ERP | real | |
| [Note1...Note5] | Comments | ERP | varchar(60) | |
| RunTime | Runtime in seconds | Eliar | int | |
| SetTime | Theoretical set time in seconds | Eliar | int | |
| OperatorTime | Operator call time in seconds | Eliar | int | |
| HoldAlarmTime | Time for hold alarms in seconds | Eliar | int | |
| StopAlarmTime | Time for stop alarms in seconds | Eliar | int | |
| ManualTime | Time for manual interventions in seconds | Eliar | int | |
| CorrectionTime | Addition time in seconds | Eliar | int | |
| StopTime | Time for stop function in seconds | Eliar | int | |
| PrepTime | Preparation time in seconds | Eliar | int | |
| [Time1...Time3] | Time counter | ERP | int | |
| Water1 - Water2 | Water type 1 and 2 consumptions | Eliar | real | |
| Power | Electricity consumption | Eliar | real | |
| HeatingEnergy | Heating energy consumption | Eliar | real | |
| CoolingEnergy | Cooling energy consumption | Eliar | real | |
| Consumption1 - Consumption2 | Consumptions for others | Eliar | real | |
| AlarmCnt | Number of alarms | Eliar | smallint | |
| InterventionCnt | Number of interventions | Eliar | smallint | |
| SendTime | Record time of dyelot | | datetime | |
| Coupling | Coupling info: 0 = not coupling, 1 = coupling | ERP | smallint | |
| Slavemachine1 | Slave machine id if Coupling = 1 | ERP | varchar(50) | |
| endState | State of the consumption feedback. 1: Batch was finished but consumptions are not processed yet. 2: Batch was finished and consumptions are processed by Eliar — ERP/Recipe software should wait until this field equals 2 to read product consumptions. 3: Batch was finished but it is not clear whether consumptions were processed (rare, multiple dyehouse scenario). | Eliar / ERP | smallint | |
| StartingOperator | Operator code who started batch | Eliar | int | |
| FinishingOperator | Operator code who finished batch | Eliar | int | |
| ColourNo | Color code | ERP | varchar(50) | |
| ColourDescript | Color description | ERP | varchar(50) | |
| ColourGroup | Colour group code | ERP | varchar(50) | |
| FiberGroup | Fiber group code | ERP | varchar(50) | |
| DyeGroup | Dye group code | ERP | varchar(50) | |
| DyeType | Dye type code | ERP | varchar(20) | |
| StartConfirm | Flag to get start info from Eliar. Default 0. Eliar sets to 1 when batch started. ERP reads if 1 to handle starting operations. ERP sets to 2 to mark "starting operations handled". | Eliar | smallint | |
| EndConfirm | Flag to get finish info from Eliar. Default 0. Eliar sets to 1 when batch finished. ERP reads if 1 to handle finishing operations. ERP sets to 2 to mark "finishing operations handled". | Eliar | smallint | |
| ActualMachine | The number of the machine that the batch started on | Eliar | int | |
| LastCompletedRequest | Last completed request index. Contains last completed dosage index when some dosages may not occur. | Eliar | int | |
| ReadyToStart | Allows ERP to manage whether a recipe can be started in Eliar controller. 0 = Recipe can be started, >0 = Recipe can NOT be started. | ERP | smallint | |
| BlockReason | If ReadyToStart <> 0, this text will be shown to the operator trying to start the recipe. | ERP | nvarchar(50) | |
| Steam | Total used theoretical steam | Eliar | real | |
| TotalWater | Total used water | Eliar | real | |
| [Water3...Water6] | Water type 3, 4, 5 and 6 consumptions | Eliar | real | |
| FabricQualityInfo | Fabric Description | ERP | varchar(100) | |
| FabricLotNumber | Reference Lot Number | ERP | varchar(32) | |
| DyehouseNumber | Separate recipes for companies with more than one dyehouse/laundry. Default -1 (single dyehouse). | ERP | int | |
| WITHOUTRECIPE | The recipe is prepared but chemical/dyestuff steps are not ready. Used to inform Eliar Planning Board. | ERP | bit | |
| CreateDate | Used to clean up database. ERP Software should NOT write any info to this field. | Eliar | Date | |

> **Notes about "Dyelots" table:** The meanings of TextX and ParameterX fields depend on the machine project configuration. Batch start parameters (like weight (Kilo), Jeans Pieces etc.) are mapped to these fields to send parameters from ERP to Eliar controller.

### Dyelot_Recipe

This table contains chemical/dyestuff steps (named online requests / product requests) of the batch (recipe).

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Auto | int | |
| Dyelot | Batch code (see Dyelots.Dyelot) | ERP | varchar(20) | |
| ReDye | Default 0 | ERP | smallint | |
| CallOff | Preparation number. Index of product (dosage) request. For automatic requests it starts from 1 and is increased for each automatic request by 1. For manual requests the previous automatic request index value must be written. If the manual request is the first one, the next index (1) will be written. | ERP | smallint | |
| Counter | Position of the product within the preparation. Product counter in the batch starts from 1 and increases by one for each request. | ERP | smallint | |
| ProductID | Foreign key to table Product | ERP | int | |
| ProductName | Product name | ERP | varchar(50) | |
| ProductCode | Product code, ExternalProductID from "Products" table | ERP | varchar(50) | |
| KindOfProduct | 1 = Dyestuff, 2 = Chemical | ERP | smallint | |
| Amount | Requested product amount. Must be written by controlling the used unit of the "Unit" field. | ERP | real | |
| Unit | Unit of product amount: "Kg", "gr" or "lt" | ERP | varchar(10) | |
| ActualAmount | Consumption | Eliar | real | |
| KindOfStation | 2: for online products, 5: for manual products | ERP | smallint | |
| TreatmentNo | Treatment (Program number in Eliar Program Editor) number | ERP | int | |
| Preparation_counter | Request (dosage) number in the program. Starts from 1 and increases for each automatic request by 1. Manuals are counted separately. | ERP | int | |
| Program_order | Program index in the batch. Starts from 1 and increases by 1 for each program. | ERP / Eliar | smallint | |
| WATER | Used water during dispensing | Eliar | real | |
| LOTNO | Lot number of dispensed product | Eliar | varchar(10) | |
| CallOffManuel | Preparation number for manual materials. Starts from 1 for the first manual request in the recipe and increases by 1 for each manual request. Must be NULL for automatic requests. | ERP | smallint | YES |

### Dyelot_Procedure

Programs in a batch (recipe) are written to this table by ERP while inserting recipe. A program is defined as a part of the recipe. Programs are written using Eliar - Program Editor by Teleskop operator.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Auto | int | |
| Dyelot | Batch code (see Dyelots.Dyelot) | ERP | varchar(20) | |
| ReDye | Write 0 | ERP | smallint | |
| TreatmentCnt | Program order in the batch, starts from 1 | ERP | smallint | |
| TreatmentNo | Program number | ERP | smallint | |

### Dyelot_Parameter

This table contains optimized parameter values of commands. Details about Command Parameter Optimization are explained in the "Command Parameter Optimization" document.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Auto | int | |
| Dyelot | Batch code (see Dyelots.Dyelot) | ERP | varchar(20) | |
| ReDye | | ERP | smallint | |
| TreatmentCnt | Counter for treatments | ERP | smallint | |
| TreatmentParaCnt | Counter for parameter | ERP | smallint | |
| TreatmentParaNo | Parameter number | ERP | smallint | |
| TreatmentParaValue | Parameter value | ERP | real | |

### Manual_Consumptions

This table contains consumption of material sent by the operator of the dispensing system manually. This table may contain unrelated batch codes (Dyelot field) because the batch code is defined by the operator in manual operations.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Eliar | int | |
| ConsumptionTime | Consumption time | Eliar | datetime | |
| Dyelot | Batch code (see Dyelots.Dyelot) | Eliar | varchar(20) | |
| OrderNo | Same field as in Dyelot table | Eliar | varchar(20) | |
| ProductCode | Product code | Eliar | varchar(50) | |
| ProductName | Product name | Eliar | varchar(50) | |
| Unit | Unit, 'kg', 'lt', 'gr' | Eliar | varchar(10) | |
| Amount | Quantity | Eliar | real | |
| isOnlineDylot | 1: online batch sent from ERP, 0: not online | Eliar | smallint | |

### Recipe_Requests

This table is used to ensure that the online request counts are the same on ERP and Eliar system. ERP writes the online request counts of programs into this table. Eliar Teleskop checks the request count while creating a program using Eliar Program Editor, and warns the Teleskop operator if there is an unsuitable request count. This table is generally useful for companies which prefer to write different programs in "Eliar - Program Editor" for each batch.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| Autokey | Auto increment | ERP | int | |
| RecipeNo | Program number at Teleskop | ERP | int | |
| DyeRequestCount | Dye request count | ERP | smallint | |
| ChemicalRequestCount | Chemical request count | ERP | smallint | |

### Dyelot_Finish_Reason

This table contains reasons to ask the operator when the operator finishes, pauses or skips a batch (recipe). ERP fills this table by setting ImportState = 1, Eliar imports the list and sets ImportState field to 10.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| DyelotFinishReasonCode | ERP primary key | ERP | varchar(16) | |
| FinishType | Type of finish reason according to dyelot state: Start = 1, Stop = 2, Finish = 3, Skip = 4, ChangeMachine = 5, Continue = 6 | ERP | varchar(12) | |
| FinishName | Finish Reason description | ERP | varchar(12) | |
| FinishReferenceCode | Teleskop primary key | ERP | int | |
| ImportState | Import Status: 1 = to update, 10 = imported without problems | ERP / Eliar | smallint | |

### Dyelot_History

Eliar writes batch (recipe) working details to this table. Detailed documentation about this table is named "Sending batch (recipe) working details to ERP - Dyelot_History Table".

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Auto | int | |
| MachineNo | Machine Number | Eliar | int | |
| OperatorID | Operator ID | Eliar | int | |
| Dyelot | Batch Code (see Dyelots.Dyelot) | Eliar | varchar(20) | |
| DyelotState | 1: Batch started, 2: Batch paused, 3: Batch finished, 4: Skipping batch to change machine, 5: Not used, 6: Batch continue (only after 2), 7: Selection of pause reason (after 2, may occur more than once) | Eliar | int | |
| DyelotFinishReason | Finish Reason for Dyelot. When batch is active, reason for pause will be written. When batch is passive, Dyelot field will be null and machine idle reason will be written here. The selected text is written after batch is finished or cancelled. If batch is cancelled to change the machine, selected text will be written. | Eliar | varchar(100) | |
| Date | History write date | Eliar | datetime | |
| FlagErpRead | Flag for ERP read. Default 0, set to 1 when read. | Eliar | int | |
| DateErpRead | ERP read date. Default value is 01.01.1900. | Eliar | datetime | |
| AckErp | ERP Description. When error occurs, error message will be written here. | Eliar | varchar(500) | |
| timestamp | Change date for the related record | Eliar | timestamp | |
| EventDate | Event Date for Controller | Eliar | datetime | |

### Other_Consumptions

This table contains machine consumptions for machines defined in "Machine Application - Other Machines". These machines are not followed by Eliar - Teleskop.

| Field Name | Description | Written By | Data Type | Can Be Empty (NULL) |
|---|---|---|---|---|
| AutoKey | Auto increment | Auto | int | |
| ConsumptionTime | Consumption time | Eliar | datetime | |
| Dyelot | Batch code (see Dyelots.Dyelot) | Eliar | varchar(20) | |
| OrderNo | Same field as in Dyelot table | Eliar | varchar(20) | |
| ProductCode | Product code | Eliar | varchar(50) | |
| ProductName | Product name | Eliar | varchar(50) | |
| Unit | Unit, 'kg', 'lt', 'gr' | Eliar | varchar(10) | |
| Amount | Quantity | Eliar | real | |
| isOnlineDylot | 1: online batch sent from ERP, 0: not online | Eliar | smallint | |
| MachineId | Machine number | Eliar | int | |
| MachineCode | Machine Name | Eliar | nvarchar(30) | |

## Important Notes

All insertion must be done in a transaction. The Eliar Integration Service checks the database periodically, and first looks for header information in the Dyelots table, then looks for detail tables (see: Dyelot_Procedure, Dyelot_Recipe). If insertion is not made in a transaction, it is possible to find header information in Dyelots table while detail information does not exist in the detail tables. This problem does not occur in an insertion process protected by a transaction, since no records can be seen until the transaction is committed.

If the software development platform does not support transactions, this problem (missing detail information) can be eliminated by inserting like this:
1. Insert header information into Dyelots table by setting ImportState field to -1.
2. Insert detail information into detail tables.
3. Update ImportState field of Dyelots table to 1 — this should be the last action.

Since the Eliar Integration Service looks for records where ImportState field is set to 1 and 30, it will not process records where ImportState is set to -1.
