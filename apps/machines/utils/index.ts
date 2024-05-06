import type { TreatmentMachineGroup, TreatmentParameter } from '~/types'

export async function addTreatmentMachineGroup(machineGroup: TreatmentMachineGroup) {
  return await $fetch('/api/treatment-parameters/machine-group', {
    method: 'POST',
    body: machineGroup,
  })
}

export async function deleteTreatmentMachineGroup(machineGroup: TreatmentMachineGroup) {
  return await $fetch('/api/treatment-parameters/machine-group', {
    method: 'DELETE',
    body: machineGroup,
  })
}

export async function editTreatmentMachineGroup(machineGroup: TreatmentMachineGroup) {
  return await $fetch('/api/treatment-parameters/machine-group', {
    method: 'PUT',
    body: machineGroup,
  })
}

export async function updateMachineGroupMachines(obj) {
  return await $fetch('/api/treatment-parameters/machine-group-machines', {
    method: 'PUT',
    body: obj,
  })
}

export async function addTreatmentParameter(param: TreatmentParameter) {
  return await $fetch('/api/treatment-parameters/treatment-parameter', {
    method: 'POST',
    body: param,
  })
}

export async function deleteTreatmentParameter(param: TreatmentParameter) {
  return await $fetch('/api/treatment-parameters/treatment-parameter', {
    method: 'DELETE',
    body: param,
  })
}

export async function editTreatmentParameter(param: TreatmentParameter) {
  return await $fetch('/api/treatment-parameters/treatment-parameter', {
    method: 'PUT',
    body: param,
  })
}

export async function updateUserPermissions(obj: object) {
  return await $fetch('/api/user-definitions/user-definition', {
    method: 'PUT',
    body: obj,
  })
}
