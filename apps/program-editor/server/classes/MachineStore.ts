import { MachineController } from './MachineController'

class MachineStore {
  readonly cache = new Map()
  get(id: number): Promise<MachineController> {
    if (this.cache.has(id)) {
      return this.cache.get(id)
    }
    const controller = MachineController.create(id)
    this.cache.set(id, controller)
    return controller
  }
}

export const machineStore = new MachineStore()
