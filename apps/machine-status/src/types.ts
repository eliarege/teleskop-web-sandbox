import type { Buffer } from 'node:buffer'
import type { ColumnType } from 'kysely'

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>

export interface BACONSUMPTIONPROGRAM {
  BATCHKEY: number
  CONSUMPTIONKEY: Generated<number>
  ELECTRICITY: number | null
  ELECTRICITY_CAPACITIVE: number | null
  ELECTRICITY_EXPORT: number | null
  ELECTRICITY_REACTIVE: number | null
  FM10VALUE: number | null
  FM1VALUE: number | null
  FM2VALUE: number | null
  FM3VALUE: number | null
  FM4VALUE: number | null
  FM5VALUE: number | null
  FM6VALUE: number | null
  FM7VALUE: number | null
  FM8VALUE: number | null
  FM9VALUE: number | null
  MACHINEID: number
  progIndexInBatch: Generated<number | null>
  PROGRAMNO: number
  SALT: Generated<number>
  STEAM: number | null
  WaterTotal: Generated<number | null>
  WaterType1: Generated<number | null>
  WaterType2: Generated<number | null>
  WaterType3: Generated<number | null>
  WaterType4: Generated<number | null>
  WaterType5: Generated<number | null>
  WaterType6: Generated<number | null>
}

export interface BADATA {
  ACTUAL_THEORETICDURAT: number | null
  ADDITIONSTARTED: Generated<boolean>
  ARCHIVED: boolean
  BATCHKEY: number
  BATCHREFERENCE: string
  CANCELDETAIL: Generated<number>
  CANCELTIME: Date | null
  CLIENTCODE: string | null
  Color: Generated<number | null>
  CORRECTIONCOUNT: number | null
  CORRECTIONREASON: string | null
  CUSTOMERNAME: string | null
  DEVIATION: number | null
  ENDCONFIRMTIME: Date | null
  ENDTIME: Date | null
  FABRIC_WEIGHT: Generated<number | null>
  FINISHREASONID: number | null
  ISCORRECTION: boolean
  JOBORDER: string
  MACHINECODE: string
  MACHINEID: number
  OPRCODE: number | null
  OPRNAME: string | null
  PARTCOUNT: number | null
  PARTYNUMBER: string | null
  PLANKEY: number | null
  PLANNEDMACHINEID: number | null
  prcssId: Generated<number | null>
  PRGCOUNT: number
  PROGRAMNOLIST: string | null
  REALDURATION: number | null
  RECIPETYPEID: Generated<number>
  startedWithPrcss: Generated<boolean | null>
  STARTTIME: Date
  STOP_DURATION_ALR: number | null
  STOP_DURATION_OPER: number | null
  STOP_DURATION_WARNING_ALR: Generated<number | null>
  STOPREASON: number | null
  THEORETICDURAT: Generated<number | null>
  theoricElectricity: Generated<boolean>
  theoricSteam: Generated<boolean>
  theoricWater: Generated<boolean>
  TRANSFERSTATUS: number | null
}

export interface BFERPPARAMETERDEFINITIONS {
  BATCHREPORTORDER: Generated<number | null>
  BATCHREPORTVISIBLE: Generated<boolean | null>
  ERPFIELDNAME: string | null
  MACHINEID: Generated<number>
  PARAMID: number
  PARAMNAME: string
  PARAMNAMEEn: Generated<string>
  PARAMTYPE: Generated<number>
  PartyNoParam: Generated<boolean | null>
}

export interface BFMACHGROUP {
  GROUPID: number
  GROUPNAME: string | null
  GROUPTYPE: number
  MMVisible: Generated<boolean | null>
}

export interface BFMACHINES {
  ADDITIONALTANK1: Generated<boolean | null>
  ADDITIONALTANK2: Generated<boolean | null>
  ADDITIONALTANK3: Generated<boolean | null>
  ADDITIONALTANK4: Generated<boolean | null>
  BATCHDOWNLOADSTATUS: Generated<number | null>
  BATCHDOWNLOADSTATUSCHANGETIME: Generated<Date | null>
  BATCHNO: Generated<string | null>
  COLOR: number | null
  COMDRIVERCOMPUTERNAME: string | null
  ELECTRICITYCOUNTERID: Generated<number>
  epacIp: string | null
  EXTENTION: Generated<string>
  FTPPORT: Generated<number | null>
  GRUPNO: Generated<number>
  HardwareModel: string | null
  INTERVAL: Generated<number | null>
  INUSE: Generated<boolean>
  IP: string
  ISLAB: Generated<boolean | null>
  ISMANUAL: Generated<boolean | null>
  IsMaster: Generated<boolean>
  ISPAUSED: Generated<number | null>
  ISVIRTUAL: Generated<boolean>
  LANGUAGEID: number | null
  LASTBATCHKEY: number | null
  LASTEVENTPROCESSDATE: Date | null
  LASTEVENTPROCESSID: number | null
  LASTJOBORDER: string | null
  LASTJOBORDERSTART: string | null
  LASTRUNNINGPROGRAMID: Generated<number | null>
  MACHINECAPACITY: number
  MACHINECODE: string
  MACHINEID: number
  MaxReelSpeed: Generated<number>
  MODELMACHINEID: Generated<number>
  MTTempIo: Generated<number>
  NOZZLECOUNT: Generated<number | null>
  ONLINEACTIVE: Generated<boolean | null>
  PHASEPARAMERROR: Generated<boolean | null>
  PlcModel: string | null
  PORT: number
  ProductModel: string | null
  RDCOMPUTERNAME: Generated<string | null>
  REELCOUNT: Generated<number | null>
  REFERENCEDATE: Date | null
  REFERENCENUMBER: number | null
  RESERVETANK: Generated<boolean | null>
  SlaveMachine: Generated<number>
  STEAMKGPERHOUR: Generated<number>
  STEAMUNIT: Generated<string>
  STEAMVALVEDO: Generated<number>
  STOREELECTRICITYASINC: Generated<boolean>
  TBBMODEL: string
  THEORETICALSTEAM: Generated<boolean>
  THEORETICALWATER: Generated<boolean>
  THEORICALCHARGE: number
  theoricalChargeDuration: Generated<number | null>
  theoricElectricity: Generated<boolean>
  theoricSteam: Generated<boolean>
  theoricWater: Generated<boolean>
  USEINTELESKOP: Generated<boolean>
  VENDORID: number | null
  VERSION: Generated<string | null>
  VNCIP: string | null
  WATERCOUNTERID: Generated<number>
  WATERTYPE_0_DO: Generated<number>
  WATERTYPE_1_DO: Generated<number>
  WATERTYPE_2_DO: Generated<number>
  WATERTYPE_3_DO: Generated<number>
  WATERTYPE_4_DO: Generated<number>
  WATERTYPE_5_DO: Generated<number>
  WATERTYPE_6_DO: Generated<number>
}

export interface TFMACHINESTATUS {
  BATCHLOADED: Generated<Buffer | null>
  conElectricity: Generated<number | null>
  conElectricityLast: Generated<number | null>
  ConnectionStatus: Generated<number | null>
  conReadDate: Generated<Date | null>
  conSteam: Generated<number | null>
  conSteamLast: Generated<number | null>
  conSteamReadDate: Generated<Date | null>
  CONSUMPTION_ELECTRICITY_CAPACITIVE_START: Generated<number | null>
  CONSUMPTION_ELECTRICITY_EXPORT_START: Generated<number | null>
  CONSUMPTION_ELECTRICITY_REACTIVE_START: Generated<number | null>
  CONSUMPTION_ELECTRICITY_START: Generated<number | null>
  conWater1: Generated<number | null>
  conWater1Last: Generated<number | null>
  conWater2: Generated<number | null>
  conWater2Last: Generated<number | null>
  currentAlarmStatus: Generated<number | null>
  currentTemp: Generated<number | null>
  ISCOUPLED: Generated<boolean | null>
  IsSynchronizing: Generated<boolean | null>
  LASTEVENTCODE: number | null
  LASTEVENTPROCESSDATE: number | null
  LASTEVENTPROCESSID: number | null
  lastPingFail: Generated<Date>
  LASTRECEIVEDBATCHEVENTDATE: Generated<number | null>
  LASTRECEIVEDEVENTDATE: Generated<number | null>
  LASTRECEIVEDEVENTID: Generated<number | null>
  LASTREFERENCEDATE: Date | null
  LASTREFERENCENUMBER: number | null
  lastSoapFail: Generated<Date>
  MACHINEID: number
  MANUELCOMMANDACTIVE: Generated<boolean>
  manuelReason: string | null
  manuelReasonDateTime: Date | null
  REQ_BATCHKEY: number | null
  REQ_CMDNO: number | null
  REQ_JOBORDER: string | null
  REQ_OPERATIONCODE: number | null
  REQ_PRGNO: number | null
  REQ_PRIORITY: number | null
  REQ_RECIPEINDEX: number | null
  REQ_REQORDERINDEX: number | null
  REQ_STATUS: number | null
  REQ_TANKNO: number | null
  REQ_TARGETRECIPE: number | null
  REQ_TOTALREQCOUNT: number | null
  RUNNING_ALARMNAME: string | null
  RUNNING_ALARMNO: number | null
  RUNNING_AUTOMANSTATUS: number | null
  RUNNING_BATCHKEY: number | null
  RUNNING_BATCHSTATUS: number | null
  RUNNING_CMDNAME: string | null
  RUNNING_CMDNO: number | null
  RUNNING_JOBORDER: string | null
  RUNNING_JOBORDERSTARTTIME: Date | null
  RUNNING_OPRNAME: string | null
  RUNNING_OPRNO: number | null
  RUNNING_PHASENAME: Generated<string | null>
  RUNNING_PHASENO: Generated<number | null>
  RUNNING_PHASESTEPNO: Generated<number | null>
  RUNNING_PROGNOLIST: string | null
  RUNNING_PROGRAMID: number | null
  RUNNING_PROGRAMNAME: string | null
  RUNNING_STEPNO: number | null
  RUNNING_THEOTIME: number | null
  RUNNINGBATCHDELAY: Generated<number>
  runningCompletionRatio: Generated<number | null>
  stopReason: string | null
  stopReasonDateTime: Date | null
  UPDATETIME: Date | null
}

export interface BFUSERS {
  userID: number
  userName: string
  userSurname: string
}
export interface BAACTUALPRGSTEPS {
  STARTTIME: string
  BATCHKEY: number
  PRGNO: number
  PARALLELSTEPNO: number
  PRGINDEX: number
}
export interface BFSTOPREASONS {
  STOPCODE: number
  STOPNAME: string
  ReportToERP: boolean
}
export interface BFMACHBATCHPARAMETERTYPES {
  MACHINEID: number
  PARAMID: number
  PARAMTYPEID: number
}
export interface DYBFBATCHPLANERPPARAMETERS {
  PLANKEY: number
  ERPVALUE: string
  ERPFIELDNAME: string | null
}
export interface TeleskopDatabase {
  BACONSUMPTIONPROGRAM: BACONSUMPTIONPROGRAM
  BADATA: BADATA
  BFERPPARAMETERDEFINITIONS: BFERPPARAMETERDEFINITIONS
  BFMACHGROUP: BFMACHGROUP
  BFMACHINES: BFMACHINES
  TFMACHINESTATUS: TFMACHINESTATUS
  BFUSERS: BFUSERS
  BAACTUALPRGSTEPS: BAACTUALPRGSTEPS
  BFSTOPREASONS: BFSTOPREASONS
  BFMACHBATCHPARAMETERTYPES: BFMACHBATCHPARAMETERTYPES
  DYBFBATCHPLANERPPARAMETERS: DYBFBATCHPLANERPPARAMETERS
}

export interface DmExchangeDatabase {
  Dyelots: {
    Dyelot: string
  }
}
