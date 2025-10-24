export enum StatusCodes {
  newRequest = 0,
  inDispenser = 1,
  inProcess = 2,
  requestCompleted = 3,
  priorityChanged = 4,
  canceled = 8,
  dispenserChanged = 10,
}
/** https://www.postgresql.org/docs/current/errcodes-appendix.html */
export enum PostgreSQLErrorCodes {
  notNull = "23502",
  foreignKey = "23503",
  unique = "23505"
}

export enum RecipeType {
  CHEM = 0,
  DYE = 1,
  SALT = 2,
  MATERIALS = 3
}

export const RecipeIcons = [
  'science',
  'palette',
  'grain',
  '',
]
