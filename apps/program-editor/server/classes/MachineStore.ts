import { fetchMachineDetails } from '../functions'
import { MachineController } from './MachineController'
import { T7ProgramClient, TonelloProgramClient } from './ProgramClient'

class MachineStore {
  readonly cache = new Map()
  async get(id: number): Promise<MachineController> {
    if (this.cache.has(id)) {
      return this.cache.get(id)
    }

    const machine = await fetchMachineDetails(id)
    const client = machine.tbbModel === 'Tonello'
      ? new TonelloProgramClient(id, machine.host)
      : new T7ProgramClient(id, machine.host)

    const controller = new MachineController(id, client)
    this.cache.set(id, controller)
    return controller
  }
}

export const machineStore = new MachineStore()
