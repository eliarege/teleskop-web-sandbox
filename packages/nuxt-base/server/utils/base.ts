import { setTimeout } from 'node:timers/promises'

/**
 * Waits for a specified number of milliseconds.
 *
 * @param ms Number of milliseconds to sleep
 * @param signal Optional AbortSignal to cancel the sleep
 * @returns A promise that resolves after the specified time or rejects if aborted
 */
export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return setTimeout(ms, void 0, { signal })
}
