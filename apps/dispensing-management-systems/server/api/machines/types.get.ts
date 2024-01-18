import { dmsDB } from '~/server/connectionPool'
import type { MachineControllerType } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const machineControllerTypes: Array<MachineControllerType> = await dmsDB('MACHINE_CONTROLLER_TYPE').select({
      controllerTypeId: 'controller_type_id',
      controllerTypeName: 'controller_type_name',
    })
      .orderBy('controller_type_id')
    return machineControllerTypes
  } catch (e) {
    console.log(e)
    return e
  }
})
