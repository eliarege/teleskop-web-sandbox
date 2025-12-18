export enum BatchStatus {
  IDLE = 0,
  STOPPED = 1,
  RUNNING = 2,
}

export enum ConnectionStatus {
  UNKNOWN = 0,
  CONNECTED = 1,
  NOTCONNECTED = 2,
  PENDING = 3,
  CONNECTED_DIFFERENT_RTC = 4,
  BATTERY_LOW = 5,
}

export enum AutoManualStatus {
  UNKNOWN = -1,
  AUTO = 0,
  MANUAL = 1,
}

export enum AlarmStatus {
  NEW = 0,
  CONFIRMED = 1,
  CLEANED = 2,
}

export enum RequestStatus {
  NEW = 0,
  SENT = 1,
  STARTED = 2,
  FINISHED = 3,
  PRIO_CHANGED = 4,
  CANCELLED = 8,
}
