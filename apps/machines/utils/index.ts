import type { FinishReason, Machine, MachineStopReason, ManualReason, RecipeType, User, WaterType } from '~/types'

export async function getMachineGroups(): Promise<string[]> {
  return await $fetch('/api/machines/machine-groups')
}

export async function getMachines(): Promise<Machine[]> {
  return await $fetch('/api/machines/machines')
}

export async function addMachine(machine: Machine) {
  await $fetch('/api/machines/machine', { method: 'POST', body: machine })
}

export async function editMachine(machine: Machine) {
  await $fetch('/api/machines/machine', { method: 'PUT', body: machine })
}

export async function deleteMachines(machineIds: string[]) {
  await $fetch('/api/machines/machine', { method: 'DELETE', body: { machineIds } })
}

export async function getUsers(): Promise<User[]> {
  return await $fetch('/api/user-definitions/user-definitions')
}

export async function addUser(user: User) {
  await $fetch('/api/user-definitions/user-definition', { method: 'POST',
body:
      user })
}

export async function editUser(user: User) {
  await $fetch('/api/user-definitions/user-definition', { method: 'PUT',
body:
      user })
}

export async function deleteUser(userIds: string[]) {
  await $fetch('/api/user-definitions/user-definition', { method: 'DELETE', body: {
    userIds,
  } })
}

export async function getManualReasons(): Promise<ManualReason> {
  return await $fetch('/api/manual-reasons/manual-reasons')
}

export async function addManualReason(manualId, newReasonName, checkReportToERP) {
  await $fetch('/api/manual-reasons/manual-reason', { method: 'POST',
body: {
    manualId,
    newManualReason: newReasonName,
    reportToERP: checkReportToERP,
  } })
}

export async function editManualReason(oldReasonName, newReasonName, checkReportToERP) {
  await $fetch('/api/manual-reasons/manual-reason', { method: 'PUT', body: {
    oldManualReason: oldReasonName,
    newManualReason: newReasonName,
    reportToERP: checkReportToERP,
  } })
}

export async function deleteManualReasons(selectedReason) {
  await $fetch('/api/manual-reasons/manual-reasons', { method: 'DELETE',body: {
      manualIds: [selectedReason[0].manualId],
    } })
}

export async function getMachineStopReasons(): Promise<MachineStopReason[]> {
  return await $fetch('/api/stop-reasons/stop-reasons')
}

export async function addStopReason(stopReasons, newStopName, checkReportToERP) {
  await $fetch('/api/stop-reasons/stop-reason', { method: 'POST',
body: {
    stopCode: stopReasons[stopReasons.length - 1].stopCode + 1,
    newStopName,
    reportToERP: checkReportToERP,
  } })
}

export async function editStopReason(oldStopName, newStopName, checkReportToERP) {
  await $fetch('/api/stop-reasons/stop-reason', { method: 'PUT', body: {
    oldStopName,
    newStopName,
    reportToERP: checkReportToERP,
  } })
}

export async function deleteStopReasons(selectedStopReason) {
  await $fetch('/api/stop-reasons/stop-reasons', { method: 'DELETE',body: {
      stopCodes: [selectedStopReason[0].stopCode],
    } })
}

export async function getFinishReasons(): Promise<FinishReason[]> {
  return await $fetch('/api/finish-reasons/finish-reasons')
}

export async function addFinishReason(finishReasons, typeId, text) {
  await $fetch('/api/finish-reasons/finish-reason', { method: 'POST',
body: {
    reasonId: finishReasons[finishReasons.length - 1].reasonId + 1,
    typeId,
    text,
  } })
}

export async function deleteFinishReasons(selectedFinishReason) {
  await $fetch('/api/finish-reasons/finish-reasons', { method: 'DELETE',body: {
      reasonIds: [selectedFinishReason[0].reasonId],
    } })
}

export async function editFinishReason(finishReason) {
  await $fetch('/api/finish-reasons/finish-reason', { method: 'PUT', body: finishReason })
}

export async function getRecipeTypes(): Promise<RecipeType[]> {
  return await $fetch('/api/recipe-types/recipe-types')
}

export async function addRecipeType(typeName) {
  await $fetch('/api/recipe-types/recipe-type', { method: 'POST',
body: {
    typeName,
  } })
}

export async function editRecipeType(id, typeName) {
  await $fetch('/api/recipe-types/recipe-type', { method: 'PUT', body: { id, typeName } })
}

export async function deleteRecipeType(recipeTypes) {
  await $fetch('/api/recipe-types/recipe-types', { method: 'DELETE',body: {
      ids: [recipeTypes[0].id],
    } })
}

export async function getWaterTypes(): Promise<WaterType[]> {
  return await $fetch('/api/water-types/water-types')
}

export async function addWaterType(waterTypeName: string) {
  await $fetch('/api/water-types/water-type', { method: 'POST', body: { waterTypeName } })
}

export async function deleteWaterTypes(waterTypes) {
  await $fetch('/api/water-types/water-types', { method: 'DELETE', body: waterTypes })
}

export async function getMachineCommands(machineId: number) {
  return await $fetch('/api/master-commands/master-commands', { method: 'POST',
body: {
    machineId,
  } })
}

export async function getSelectedTimeoutReasons(machineId: number, commandNo: number) {
  return await $fetch('/api/command-timeout-reasons/selected-timeout-reasons', { method: 'POST',
body: {
    machineId,
    commandNo,
  } })
}

export async function getTimeoutReasons() {
  return await $fetch('/api/command-timeout-reasons/timeout-reasons')
}

export async function editMachineGroupType(group) {
  await $fetch('/api/machines/machine-group-type', { method: 'PUT', body: group })
}
