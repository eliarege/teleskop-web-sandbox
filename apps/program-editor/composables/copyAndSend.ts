import type { CopyAndSendResult } from '~/server/utils/JobManager'

export const useCopyAndSendStore = defineStore('copy-and-send', () => {
  const { $commandManager } = useNuxtApp()
  const $q = useQuasar()

  const results = ref<CopyAndSendResult[]>([])

  function showResults(machine: { id: number, name: string }, data: CopyAndSendResult[]) {
    results.value = data
    $commandManager.executeCommand('showResultsDialog', { $q }, machine, results.value)
  }

  function clearResults() {
    results.value = []
  }

  return {
    results,
    showResults,
    clearResults,
  }
})
