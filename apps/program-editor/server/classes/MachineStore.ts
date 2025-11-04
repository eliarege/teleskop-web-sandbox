import { fetchMachineDetails } from '../functions'
import { MachineController } from './MachineController'
import { T7ProgramClient, TonelloProgramClient } from './ProgramClient'

class MachineStore {
  async get(id: number): Promise<MachineController> {
    const machine = await fetchMachineDetails(id)
    const client = machine.tbbModel === 'Tonello'
      ? new TonelloProgramClient(id, machine.host)
      : new T7ProgramClient(id, machine.host)

    const controller = new MachineController(id, client)
    return controller
  }
}

export const machineStore = new MachineStore()
