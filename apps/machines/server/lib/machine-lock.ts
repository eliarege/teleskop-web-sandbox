// Simple in-memory machine lock manager
// Need to prevent machine being updated while there is a lock attached to it
// Locks should have a timeout to avoid deadlocks

type Lock = {
  reason?: string
  expiresAt: number
}

type LockAcquireResult =
  | { success: true }
  | { success: false, reason: string | null }

type LockCheckResult =
  | { locked: true, reason: string | null }
  | { locked: false }

const locks = new Map<number, Lock>()
const lockTimeout = 5 * 60 * 1000 // 5 minutes

export function acquireMachineLock(machineId: number, reason?: string): LockAcquireResult {
  const now = Date.now()
  const existingLock = locks.get(machineId)

  if (existingLock && existingLock.expiresAt > now) {
    return { success: false, reason: existingLock.reason || null }
  }

  // Acquire new lock
  locks.set(machineId, {
    reason,
    expiresAt: now + lockTimeout,
  })
  return { success: true }
}

export function releaseMachineLock(machineId: number): void {
  locks.delete(machineId)
}

export function isMachineLocked(machineId: number): LockCheckResult {
  const now = Date.now()
  const existingLock = locks.get(machineId)

  if (existingLock && existingLock.expiresAt > now) {
    return { locked: true, reason: existingLock.reason || null }
  }

  locks.delete(machineId)
  return { locked: false }
}
