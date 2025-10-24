import type { PlanParameters } from '~/shared/types'

interface PlanParametersModal {
  show: boolean
  planKey: number
  machineId: number
  progNoList: string
  isBatchStarted: boolean
  missingParams: PlanParameters[]
  isSendMachine: boolean
  uploadData?: any
  onComplete?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
}

const modalState = reactive<PlanParametersModal>({
  show: false,
  planKey: 0,
  machineId: 0,
  progNoList: '',
  isBatchStarted: false,
  missingParams: [],
  isSendMachine: false,
  uploadData: undefined,
  onComplete: undefined,
  onCancel: undefined,
})

export function usePlanParametersModal() {
  function setPlanParameters(
    show: boolean,
    planKey: number,
    machineId: number,
    progNoList: string,
    isBatchStarted: boolean,
    missingParams: PlanParameters[],
    isSendMachine: boolean,
    uploadData?: any,
    onComplete?: () => void | Promise<void>,
    onCancel?: () => void | Promise<void>,
  ) {
    modalState.show = show
    modalState.machineId = machineId
    modalState.progNoList = progNoList
    modalState.planKey = planKey
    modalState.isBatchStarted = isBatchStarted
    modalState.missingParams = missingParams
    modalState.isSendMachine = isSendMachine
    modalState.onComplete = onComplete
    modalState.onCancel = onCancel
    if (uploadData) {
      modalState.uploadData = uploadData
    }
  }

  function closeModal() {
    modalState.show = false
    modalState.onComplete = undefined
    modalState.onCancel = undefined
  }

  async function completeAndClose() {
    if (modalState.onComplete) {
      await modalState.onComplete()
    }
    closeModal()
  }

  async function cancelAndClose() {
    if (modalState.onCancel) {
      await modalState.onCancel()
    }
    closeModal()
  }

  return {
    modalState,
    setPlanParameters,
    closeModal,
    completeAndClose,
    cancelAndClose,
  }
}
