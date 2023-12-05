import { Mutex } from 'async-mutex'

export function lockMachine(machineId: number, clientSet: any) {
  if (clientSet) {
    clientSet.add(machineId)
  }
}

export function unlockMachine(machineId: number, clientSet: any) {
  if (clientSet) {
    clientSet.delete(machineId)
  }
}

export function unlockAllClientMachines(clientSet: any) {
  if (clientSet) {
    clientSet.clear()
  }
}
const mutex = new Mutex()
export async function taskValidation() {
  // mutex
}

export function getAllTasks(clientTasks: Record<string, string[]>): string[] {
  const allTasks: string[] = []
  for (const clientId in clientTasks) {
    const clientTaskIds = clientTasks[clientId]
    if (Array.isArray(clientTaskIds)) {
      allTasks.push(...clientTaskIds)
    } else {
      console.error(`Invalid data for clientId ${clientId}`)
    }
  }
  return allTasks
}

export function lockTask(task: number) {
  // lock context.grabbed ...
}
export function unlockTask(task: number) {
  // unlock context.grabbed ...
}
