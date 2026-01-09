// Simple in-memory machine lock manager
// Need to prevent machine being updated while there is a lock attached to it
// Locks should have a timeout to avoid deadlocks

type Lock = {
  expiresAt: number
}

const locks = new Map<number, Lock>()
const lockTimeout = 5 * 60 * 1000 // 5 minutes

export function acquireMachineLock(machineId: number): boolean {
  const now = Date.now()
  const existingLock = locks.get(machineId)

  if (existingLock && existingLock.expiresAt > now) {
    return false
  }

  // Acquire new lock
  locks.set(machineId, {
    expiresAt: now + lockTimeout,
  })
  return true
}

export function releaseMachineLock(machineId: number): void {
  locks.delete(machineId)
}

export function isMachineLocked(machineId: number): boolean {
  const now = Date.now()
  const existingLock = locks.get(machineId)

  if (existingLock && existingLock.expiresAt > now) {
    return true
  }

  locks.delete(machineId)
  return false
}
