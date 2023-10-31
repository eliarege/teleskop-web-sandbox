import type { Machine, User } from '~/types'

export async function getMachineGroups() {
  return await $fetch('/api/machine/machine-group')
}

export async function getMachines() {
  return await $fetch('/api/machine/machines')
}

export async function addMachine(machine: Machine) {
  await $fetch('/api/machine/machine-add', { method: 'POST', body: machine })
}

export async function editMachine(machine: Machine) {
  await $fetch('/api/machine/machine-edit', { method: 'PUT', body: machine })
}

export async function deleteMachines(machineIds: string[]) {
  await $fetch('/api/machine/machine-delete', { method: 'DELETE', body: { machineIds } })
}

export async function getUsers() {
  return await $fetch('/api/machine/user-definitions')
}

export async function addUser(user: User) {
  await $fetch('/api/machine/user-add', { method: 'POST',
body:
      user })
}

export async function editUser(user: User) {
  await $fetch('/api/machine/user-edit', { method: 'PUT',
body:
      user })
}

export async function deleteUser(userIds: string[]) {
  await $fetch('/api/machine/user-delete', { method: 'DELETE', body: {
    userIds,
  } })
}

export async function getManualReasons() {
  return await $fetch('/api/machine/manual-reasons')
}

export async function addManualReason(manualId, newReasonName, checkReportToERP) {
  await $fetch('/api/machine/add-manual-reason', { method: 'POST',
body: {
    manualId,
    newManualReason: newReasonName,
    reportToERP: checkReportToERP,
  } })
}

export async function editManualReason(oldReasonName, newReasonName, checkReportToERP) {
  await $fetch('/api/machine/edit-manual-reason', { method: 'PUT', body: {
    oldManualReason: oldReasonName,
    newManualReason: newReasonName,
    reportToERP: checkReportToERP,
  } })
}

export async function deleteManualReasons(selectedReason) {
  await $fetch('/api/machine/delete-manual-reasons', { method: 'DELETE',body: {
      manualIds: [selectedReason[0].manualId],
    } })
}

export async function getMachineStopReasons() {
  return await $fetch('api/machine/stop-reasons')
}

export async function addStopReason(stopReasons, newStopName, checkReportToERP) {
  await $fetch('/api/machine/add-stop-reason', { method: 'POST',
body: {
    stopCode: stopReasons[stopReasons.length - 1].stopCode + 1,
    newStopName,
    reportToERP: checkReportToERP,
  } })
}

export async function editStopReason(oldStopName, newStopName, checkReportToERP) {
  await $fetch('/api/machine/edit-stop-reason', { method: 'PUT', body: {
    oldStopName,
    newStopName,
    reportToERP: checkReportToERP,
  } })
}

export async function deleteStopReasons(selectedStopReason) {
  await $fetch('/api/machine/delete-stop-reasons', { method: 'DELETE',body: {
      stopCodes: [selectedStopReason[0].stopCode],
    } })
}

export async function getFinishReasons() {
  return await $fetch('/api/machine/finish-reasons')
}

export async function addFinishReason(finishReasons, typeId, text) {
  await $fetch('/api/machine/add-finish-reason', { method: 'POST',
body: {
    reasonId: finishReasons[finishReasons.length - 1].reasonId + 1,
    typeId,
    text,
  } })
}

export async function deleteFinishReasons(selectedFinishReason) {
  await $fetch('/api/machine/delete-finish-reasons', { method: 'DELETE',body: {
      reasonIds: [selectedFinishReason[0].reasonId],
    } })
}

export async function editFinishReason(finishReason) {
  await $fetch('/api/machine/edit-finish-reason', { method: 'PUT', body: finishReason })
}
