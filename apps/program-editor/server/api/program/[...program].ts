import { createRouter, defineEventHandler, useBase } from 'h3'
import { MachineController } from '~/server/classes/MachineController'
import { machineStore } from '~/server/classes/MachineStore'

const router = createRouter()
export default useBase('/api/program', router.handler)

// router.post('/create-machine-controller/:machineId', defineEventHandler(async (event) => {
//   if (!event.context.params) {
//     throw new Error('URL parameters are undefined')
//   }
//   event.context.params.machineId
//     ? machineController = await MachineController.create(Number(event.context.params.machineId))
//     : machineController = null
//   return 1
// }))

router.get('/program/:machineID/:programNo', defineEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const controller = await machineStore.get(Number(event.context.params.machineID))
  return await controller.fetchProgram(Number(event.context.params.programNo))
}))

router.get('/has-program/:machineID/:programNo', defineEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  return await (await machineStore.get(Number(event.context.params.machineID))).hasProgram(Number(event.context.params.programNo))
}))

router.post('/program/:machineID', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const controller = await machineStore.get(Number(event.context.params.machineID))
  return controller.insertProgram(body.program)
}))
