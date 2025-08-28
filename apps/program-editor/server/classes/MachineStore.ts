import { getMachineHost } from '../functions'
import { MachineController } from './MachineController'
import { T7ProgramClient } from './ProgramClient'

class MachineStore {
  readonly cache = new Map()
  async get(id: number): Promise<MachineController> {
    if (this.cache.has(id)) {
      return this.cache.get(id)
    }

    const host = await getMachineHost(id)
    const client = new T7ProgramClient(id, host)
    const controller = new MachineController(id, client)
    this.cache.set(id, controller)
    return controller
  }
}

export const machineStore = new MachineStore()
