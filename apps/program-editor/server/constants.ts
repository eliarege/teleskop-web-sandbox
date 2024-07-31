export const BEGIN_HEADER = '-----HEADER-----'
export const BEGIN_PROGRAM = '-----PROGRAM-----'
export const FIRST_COMMAND_NO = '998'
export const LAST_COMMAND_NO = '999'

export const NAME = 'ISIM'
export const CREATED_AT_DATE = 'OLUSTURMATARIH'
export const CREATED_AT_TIME = 'OLUSTURMASAAT'
export const UPDATED_AT_DATE = 'DEGISIKLIKTARIH'
export const UPDATED_AT_TIME = 'DEGISIKLIKSAAT'
export const AUTHOR = 'YAZAR'
export const COMMENT = 'YORUMLAR'
export const PROCESS_CODE = 'PROCESSCODE'
export const START_TAGS = 'START_TAGS'
export const END_TAGS = 'END_TAGS'

export const MSSQL_ERROR = {
  DUPLICATE_PK: 2627,
}

export const ProgramEditorActivityCodes = {
  LOGGEDIN: 1,
  LOGGEDOUT: 2,
  PROGRAMSENT: 102, //
  PROGRAMRECEIVED: 103, //
  PROGRAMCREATED: 104, //
  PROGRAMDELETED: 105, //
  PROGRAMCHANGED: 106, //
  PROGRAMCOPIED: 107, //
  PROGRAMDELETED_CONTROLLER: 108, //
  PROGRAMNOCHANGED: 109,
  PROGRAMNAMECHANGED: 110, //
} as const

// Treatmentlarda bir grup kullanılır.
export const GENERAL_TREATMENT_GROUPNO = 1
