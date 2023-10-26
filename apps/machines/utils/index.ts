import type { Machine } from '~/types'

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
  await $fetch('/api/machine/machine-edit', { method: 'POST', body: machine })
}

export async function deleteMachines(machineIds: string[]) {
  await $fetch('/api/machine/machine-delete', { method: 'POST', body: { machineIds } })
}

export async function getUsers() {
  return await $fetch('/api/machine/user-definitions')
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
  await $fetch('/api/machine/delete-manual-reasons', { method: 'POST',body: {
      manualIds: [selectedReason[0].manualId],
    } })
}
