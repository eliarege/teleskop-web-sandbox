/**
 * This file contains TypeScript types representing teleskop database tables.
 */

/**
 * `BFMACHIN` table stores machine analog input definitions.
 */
export type BFMACHAIN = {
  MACHINEID: number
  ID: number
  CARD: number
  CANAL: number
  NAME?: string | null
  ENABLED: boolean
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
  MIMICID?: number | null
  CALIBTYPE?: number | null
  CALIBMAXVALUE?: number | null
  CALIBUNIT?: string | null
}

/**
 * `BFMACHOUT` table stores machine analog output definitions.
 */
export type BFMACHAOUT = {
  MACHINEID: number
  ID: number
  CARD: number
  CANAL: number
  NAME?: string | null
  DEFAULTVALUE: number
  ENABLED: boolean
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
  MIMICID?: number | null
}

/**
 * `BFMACHDIN` table stores machine digital input definitions.
 */
export type BFMACHDIN = {
  MACHINEID: number
  ID: number
  CARD: number
  CANAL: number
  NAME?: string | null
  ENABLED: boolean
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
}

/**
 * `BFMACHDOUT` table stores machine digital output definitions.
 */
export type BFMACHDOUT = {
  MACHINEID: number
  ID: number
  CARD: number
  CANAL: number
  NAME?: string | null
  DEFAULTVALUE: number
  ENABLED: boolean
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
}

/**
 * `BFMACHCOUNTER` table stores machine counter definitions.
 */
export type BFMACHCOUNTER = {
  MACHINEID: number
  ID: number
  CARD: number
  CANAL: number
  NAME?: string | null
  ENABLED: boolean
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
  CALIBUNIT?: string | null
}

/**
 * `BFMASTERCOMMANDS` table stores machine command definitions.
 */
export type BFMASTERCOMMANDS = {
  MACHINEID: number
  COMMANDNO: number
  FUNCTIONID?: number | null
  TBBFUNTIONNAME: string
  NAME: string
  ACTIVATED: boolean
  ADVICELIST?: string | null
  DONTUSELIST?: string | null
  ISRUNMANUAL: boolean
  COMMANDTYPE: number
  MOVEPARALLEL: number
  CHANGETIME?: Date | null
  TBBCHANGETIME?: Date | null
  ISDELETED: boolean
  ISCHANGED: boolean
  X?: string | null
  Y?: string | null
  A?: string | null
  B?: string | null
  MAXA?: string | null
  ISTEMPERATURE?: boolean | null
  ISUNLOAD?: boolean | null
  ICON?: string | null
  GROUPID?: number | null
}

/**
 * `BFCOMMANDPARAMETERS` table stores machine command parameter definitions.
 */
export type BFCOMMANDPARAMETERS = {
  MACHINEID: number
  COMMANDNO: number
  /**
   * Index of the parameter in the command.
   */
  PARAMETERINDEX: number
  /**
   * Parameter label in default locale.
   */
  PARAMSTRING: string
  COMMANDDEFINITION: boolean
  PROGRAMEDITING: boolean
  BATCHPLANNING: boolean
  BATCHSTART: boolean
  COMMANDRUN: boolean
  /**
   * Always `false` in this context.
   */
  RECIPE: boolean
  /**
   * Default value for the parameter.
   */
  VALUE?: string | null
  /**
   * Type of the parameter.
   *
   * - 0: Number
   * - 1: Select
   * - 2: Bit
   */
  PARAMETERTYPE: number
  /**
   * When parameter type is `select`, this is a space-separated list of options.
   *
   * Format: `"Option 1" "Option 2" ...`
   */
  SELECTIONLIST?: string | null
  /**
   * When parameter type is `select`, this is a space-separated list of values for corresponding options.
   *
   * Format: `"1" "2" ...`
   */
  SELECTIONVALUES?: string | null
  UNITCODE?: number | null
  /**
   * - When parameter type is `select`, this is the minimum value of the options.
   * - When parameter type is `number`, this is the minimum value.
   * - When parameter type is `bit`, this is always `0`.
   */
  PARAMLOWLIMIT: number
  /**
   * - When parameter type is `select`, this is the maximum value of the options.
   * - When parameter type is `number`, this is the maximum value.
   * - When parameter type is `bit`, this is always `1`.
   */
  PARAMHIGHLIMIT: number
  CONTAINSVARIABLE: boolean
  /**
   * Display format for the parameter value. (Bad naming) Always `0` in this context.
   *
   * - 0: None
   * - 1: Temperature parameter
   * - 2: Duration parameter
   */
  TEMPERATURE: number
  USEDEFAULT: boolean
  /**
   * Always `false` in this context.
   */
  ISCOMMANDVARIABLE: boolean
  /**
   * Always `false` in this context.
   */
  TBBFORMUL: boolean
  USEFORMULA?: boolean | null

  /**
   * Group index of the parameter in the command. Only used in Tonello integration.
   */
  PARAMETERGROUP?: number

  /**
   * Important for Tonello Integration
   */
  VALUEINDEX: number

  /**
   * Decimal used for parameter value. Important for Tonello Integration
   */
  DECIMALS: number | null
}

/**
 * `BFCOMMANDINPUTOUTPUTS` table stores machine command input/output definitions.
 */
export type BFCOMMANDINPUTOUTPUTS = {
  IOINDEX: number
  MACHINEID: number
  COMMANDNO: number
  IOID: number
  IOTYPE: number
  NAME: string
  PROGRAMEDITING: boolean
  COMMANDRUN: boolean
}

/**
 * `BFCOMMANDSELECTIONLIST` table stores machine command selection lists.
 */
export type BFCOMMANDSELECTIONLIST = {
  IOINDEX: number
  MACHINEID: number
  COMMANDNO: number
  SELECTINDEX: number
  IOTYPE: number
  IOID: number
  NAME: string
  SELECTEDIOID?: number | null
  ISDEFAULT: boolean
  MODEL?: string | null
  EXTENTION?: string | null
}

/**
 * `BFPROJELOCALE` table stores available project locales
 */
export type BFPROJECTLOCALE = {
  id: number
  code: string
  name: string
}

/**
 * `BFPROJECTMESSAGES` table stores messages used in projects per machine.
 */
export type BFPROJECTMESSAGES = {
  machine_id: number
  message_id: number
  note: string
}

/**
 * `BFPROJECTTRANSLATIONS` table stores machine messages translations.
 */
export type BFPROJECTTRANSLATIONS = {
  machine_id: number
  message_id: number
  locale_id: number
  text: string
}

/**
 * `BFMACHINES` table stores machine definitions.
 */
export type BFMACHINES = {
  MACHINEID: number
  MACHINECODE: string
  TBBMODEL: string
  THEORICALCHARGE: number
  MACHINECAPACITY: number
  IP: string
  PORT: number
  EXTENTION: string
}

/**
 * `BFMACHPARAMETERS` table stores machine constant definitions.
 */
export type BFMACHPARAMETERS = {
  MACHINEID: number
  MACHINEPARAMETERID: number
  PARAMSTRING?: string | null
  PARAMLOWLIMIT: number
  PARAMHIGHLIMIT: number
  PARAMETERTYPE: number
  SELECTIONLIST: string
  UNITCODE: number
  SELECTIONVALUES: string
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
  DEFAULTVALUE?: number | null
  dmArea?: number | null
  consScreen?: number | null
  consFormat?: number | null
  consUnit?: number | null
  currentValue?: number | null
}

export type BFMACHBATCHPARAMETERS = {
  BATCHPARAMETERID: number
  MACHINEID: number
  PARAMSTRING?: string | null
  PARAMLOWLIMIT: number
  PARAMHIGHLIMIT: number
  BATCHPLANNING: boolean
  BATCHSTART: boolean
  RECIPE: boolean
  DEFAULTVALUE?: number | null
  PARAMETERTYPE?: number | null
  SELECTIONLIST: string
  UNITCODE?: number | null
  SELECTIONVALUES: string
  ISDELETED: boolean
  TBBCHANGETIME?: Date | null
  CHANGETIME?: Date | null
  FORMAT?: number | null
  PARAMETERID?: number | null
  UNITTEXT?: string | null
  PARAMSTRINGEn: string
  SELECTIONLISTDEFAULT?: string | null
  MACHINECONSTANTFORLOWLIMIT?: number | null
  MACHINECONSTANTFORHIGHLIMIT?: number | null
  VISIBILITY?: boolean | null
}
