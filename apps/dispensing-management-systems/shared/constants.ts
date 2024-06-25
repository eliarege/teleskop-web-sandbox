export enum StatusCodes {
  newRequest = 0,
  inDispenser = 1,
  inProcess = 2,
  requestCompleted = 3,
  priorityChanged = 4,
  canceled = 8,
  dispenserChanged = 10,
}

export enum ErrorCodes {
  notNull = "23502",
  foreignKey = "23503",
  unique = "23505"
}
