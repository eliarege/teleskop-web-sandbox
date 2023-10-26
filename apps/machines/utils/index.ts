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

export async function getManualReasons() {
  return await $fetch('/api/machine/manual-reasons')
}

export async function addManualReason(manualReasons, newReasonName, checkReportToERP) {
  await $fetch('/api/machine/add-manual-reason', { method: 'POST',
body: {
    manualId: manualReasons[manualReasons.length - 1].manualId + 1,
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
  await $fetch('/api/machine/add-manual-reason', { method: 'POST',
body: {
    stopCode: stopReasons[stopReasons.length - 1].manualId + 1,
    newStopName,
    reportToERP: checkReportToERP,
  } })
}

export async function editStopReason(oldStopName, newStopName, checkReportToERP) {
  await $fetch('/api/machine/edit-manual-reason', { method: 'PUT', body: {
    oldManualReason: oldStopName,
    newManualReason: newStopName,
    reportToERP: checkReportToERP,
  } })
}

export async function deleteStopReasons(selectedStopReason) {
  await $fetch('/api/machine/delete-manual-reasons', { method: 'DELETE',body: {
      stopCodes: [selectedStopReason[0].stopCode],
    } })
}
