import type { CommandType, CommandTypeEvent, ErpParameter, FinishReason, Machine, ManualReason, RecipeType, StepReason, StopReason, TreatmentMachineGroup, TreatmentParameter, User, WaterType } from '~/types'

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
  await $fetch('/api/machines/machine', {
    method: 'DELETE',
    body: { machineIds },
  })
}

export async function getUsers(): Promise<User[]> {
  return await $fetch('/api/user-definitions/user-definitions')
}

export async function addUser(user: User) {
  await $fetch('/api/user-definitions/user-definition', {
    method: 'POST',
    body: user,
  })
}

export async function editUser(user: User) {
  await $fetch('/api/user-definitions/user-definition', {
    method: 'PUT',
    body:
      user,
  })
}

export async function deleteUser(userIds: string[]) {
  await $fetch('/api/user-definitions/user-definition', {
    method: 'DELETE',
    body: {
      userIds,
    },
  })
}

export async function getManualReasons(): Promise<ManualReason> {
  return await $fetch('/api/manual-reasons/manual-reasons')
}

export async function addManualReason(manualReasons: ManualReason[], reason: ManualReason) {
  const manualId = manualReasons[manualReasons.length - 1].manualId + 1
  await $fetch('/api/manual-reasons/manual-reason', {
    method: 'POST',
    body: {
      manualId,
      manualReason: reason.manualReason,
      reportToERP: reason.reportToERP,
    },
  })
}

export async function editManualReason(reason: ManualReason) {
  await $fetch('/api/manual-reasons/manual-reason', { method: 'PUT', body: reason })
}

export async function deleteManualReasons(reason: ManualReason) {
  await $fetch('/api/manual-reasons/manual-reasons', {
    method: 'DELETE',
    body: {
      manualIds: [reason.manualId],
    },
  })
}

export async function getMachineStopReasons(): Promise<StopReason[]> {
  return await $fetch('/api/stop-reasons/stop-reasons')
}

export async function addStopReason(reasons: StopReason[], reason: StopReason) {
  await $fetch('/api/stop-reasons/stop-reason', {
    method: 'POST',
    body: {
      stopCode: reasons[reasons.length - 1].stopCode + 1,
      stopName: reason.stopName,
      reportToERP: reason.reportToERP,
    },
  })
}

export async function editStopReason(reason: StopReason) {
  await $fetch('/api/stop-reasons/stop-reason', { method: 'PUT', body: reason })
}

export async function deleteStopReasons(reason: StopReason) {
  await $fetch('/api/stop-reasons/stop-reasons', {
    method: 'DELETE',
    body: {
      stopCodes: [reason.stopCode],
    },
  })
}

export async function getFinishReasons(): Promise<FinishReason[]> {
  return await $fetch('/api/finish-reasons/finish-reasons')
}

export async function addFinishReason(finishReasons, typeId, text) {
  await $fetch('/api/finish-reasons/finish-reason', {
    method: 'POST',
    body: {
      reasonId: finishReasons[finishReasons.length - 1].reasonId + 1,
      typeId,
      text,
    },
  })
}

export async function deleteFinishReasons(selectedFinishReason) {
  await $fetch('/api/finish-reasons/finish-reasons', {
    method: 'DELETE',
    body: {
      reasonIds: [selectedFinishReason.reasonId],
    },
  })
}

export async function editFinishReason(finishReason) {
  await $fetch('/api/finish-reasons/finish-reason', { method: 'PUT', body: finishReason })
}

export async function getRecipeTypes(): Promise<RecipeType[]> {
  return await $fetch('/api/recipe-types/recipe-types')
}

export async function addRecipeType(typeName) {
  await $fetch('/api/recipe-types/recipe-type', {
    method: 'POST',
    body: {
      typeName,
    },
  })
}

export async function editRecipeType(id, typeName) {
  await $fetch('/api/recipe-types/recipe-type', {
    method: 'PUT',
    body: { id, typeName },
  })
}

export async function deleteRecipeType(recipeType: RecipeType) {
  await $fetch('/api/recipe-types/recipe-types', {
    method: 'DELETE',
    body: {
      ids: [recipeType.id],
    },
  })
}

export async function getWaterTypes(): Promise<WaterType[]> {
  return await $fetch('/api/water-types/water-types')
}

export async function addWaterType(waterTypeName: string) {
  await $fetch('/api/water-types/water-type', {
    method: 'POST',
    body: { waterTypeName },
  })
}

export async function deleteWaterTypes(waterType: WaterType) {
  await $fetch('/api/water-types/water-types', { method: 'DELETE', body: [waterType.waterTypeId] })
}

export async function getMachineCommands(machineId: number) {
  return await $fetch('/api/master-commands/master-commands', {
    method: 'GET',
    query: {
      machineId,
    },
  })
}

export async function getSelectedTimeoutReasons(machineId: number, commandNo: number) {
  return await $fetch('/api/command-timeout-reasons/selected-timeout-reasons', {
    method: 'POST',
    body: {
      machineId,
      commandNo,
    },
  })
}

export async function getTimeoutReasons() {
  return await $fetch('/api/command-timeout-reasons/timeout-reasons')
}

export async function editMachineGroupType(group) {
  await $fetch('/api/machines/machine-group-type', { method: 'PUT', body: group })
}

export async function checkTimeoutReason(reason) {
  await $fetch('/api/command-timeout-reasons/check-command-timeout-reason', { method: 'POST', body: reason })
}

export async function uncheckTimeoutReason(reason) {
  await $fetch('/api/command-timeout-reasons/uncheck-command-timeout-reason', { method: 'DELETE', body: reason })
}

export async function addCommandTimeoutReason(reasonText: string) {
  await $fetch('/api/command-timeout-reasons/command-timeout-reason', {
    method: 'POST',
    body: { reasonText },
  })
}

export async function editCommandTimeoutReason(id: number, reasonText: string) {
  await $fetch('/api/command-timeout-reasons/command-timeout-reason', {
    method: 'PUT',
    body: { reasonText, id },
  })
}

export async function deleteCommandTimeoutReason(id) {
  await $fetch('/api/command-timeout-reasons/command-timeout-reason', {
    method: 'DELETE',
    body: { id },
  })
}

export async function checkStepSkippingReason(command) {
  await $fetch('/api/step-skipping-reasons/check-reason', { method: 'POST', body: command })
}

export async function uncheckStepSkippingReason(command) {
  await $fetch('/api/step-skipping-reasons/uncheck-reason', { method: 'DELETE', body: command })
}

export async function addStepSkippingReason(reason: StepReason) {
  await $fetch('/api/step-skipping-reasons/reason', { method: 'POST', body: reason })
}

export async function editStepSkippingReason(reason: StepReason, oldReasonId: string) {
  await $fetch('/api/step-skipping-reasons/reason', {
    method: 'PUT',
    body: { reason, oldReasonId },
  })
}

export async function deleteStepSkippingReason(reason: StepReason) {
  await $fetch('/api/step-skipping-reasons/step-skipping-reasons', {
    method: 'DELETE',
    body: { reasonIds: [reason.id] },
  })
}

export async function addOtherMachine(otherMachine: Machine) {
  await $fetch('/api/machines/other-machine', { method: 'POST', body: otherMachine })
}

export async function editOtherMachine(machine: Machine, oldId: number) {
  await $fetch('/api/machines/other-machine', {
    method: 'PUT',
    body: { machine, oldId },
  })
}

export async function deleteOtherMachine(machine: Machine) {
  await $fetch('/api/machines/other-machine', {
    method: 'DELETE',
    body: { machineIds: [machine.machineId] },
  })
}

export async function selectConsumptionCounter(machineId, counterId1, counterId2) {
  await $fetch('/api/consumption-counters/consumption-counter', {
    method: 'POST',
    body: {
      machineId,
      counterId1,
      counterId2,
    },
  })
}

export async function selectStartingParameterType(machineId, paramTypeId, paramId) {
  await $fetch('/api/starting-parameter-types/starting-parameter-type', {
    method: 'POST',
    body: {
      machineId,
      paramTypeId,
      paramId,
    },
  })
}

export async function selectSmartRequestCommand(machineId, commandTypeId, commandNo) {
  if (commandNo === -1) {
    await $fetch('/api/smart-request-commands/smart-request-command', {
      method: 'DELETE',
      body: {
        machineId,
        commandTypeId,
        commandNo,
      },
    })
  } else
    await $fetch('/api/smart-request-commands/smart-request-command', {
      method: 'POST',
      body: {
        machineId,
        commandTypeId,
        commandNo,
      },
    })
}

export async function getMachineAccessFails(machineIds, eventCodes) {
  return await $fetch('/api/machine-access-fails/machine-access-fails', {
    method: 'POST',
    body: { machineIds, eventCodes },
  })
}

export async function getControllerClosedTimes(machineIds, closedTypes) {
  return await $fetch('/api/controller-closed-times/controller-closed-times', {
    method: 'POST',
    body: { machineIds, closedTypes },
  })
}

export async function addTankDefinition(tankDef: object) {
  return await $fetch('/api/tank-definitions/tank-definition', {
    method: 'POST',
    body: tankDef,
  })
}

export async function upsertTheoreticalWaterConsumption(obj: object) {
  return await $fetch('/api/theoretical-water-consumptions/theoretical-water-consumption', {
    method: 'POST',
    body: obj,
  })
}

export async function updateTankDefinitionList(tankDefinition) {
  return await $fetch('/api/tank-definitions/tank-definition-list', {
    method: 'PUT',
    body: tankDefinition,
  })
}

export async function addTankMaterialMap(body: object) {
  return await $fetch('/api/materials/material-tank-map', {
    method: 'POST',
    body,
  })
}

export async function deleteTankMaterialMap(body: object) {
  return await $fetch('/api/materials/material-tank-map', {
    method: 'DELETE',
    body,
  })
}

export async function updateTankMaterialWaterDefinition(body: object) {
  return await $fetch('/api/materials/material-tank-water-definition', {
    method: 'POST',
    body,
  })
}

export async function addErpParameterField(paramId: number, machineId: number, erpParameter: ErpParameter) {
  return await $fetch('/api/erp/erp-parameter', {
    method: 'POST',
    body: { paramId, machineId, erpParameter },
  })
}

export async function updateErpParameterField(erpParameter: ErpParameter) {
  return await $fetch('/api/erp/erp-parameter', {
    method: 'PUT',
    body: { erpParameter },
  })
}

export async function deleteErpParameterField(erpParameter: ErpParameter) {
  return await $fetch('/api/erp/erp-parameter', {
    method: 'DELETE',
    body: { erpParameter },
  })
}

export async function updateCommandTypeDefinitions(commandType: CommandTypeEvent) {
  return await $fetch('/api/commands/command-types', {
    method: 'PUT',
    body: commandType,
  })
}

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
