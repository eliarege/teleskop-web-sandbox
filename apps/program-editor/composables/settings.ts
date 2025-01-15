import type { ProgramWriteSettings } from '~/shared/types'

export function useProgramWriteSettings() {
  const kc = useKeycloak()
  if (kc.enabled) {
    until(kc.didInitialise).toBe(true)
  }

  const username = kc.tokenParsed.value?.preferred_username || 'guest'
  const key = `pe.programWriteSettings.${username}`

  return useLocalStorage<ProgramWriteSettings>(key, {
    addParallelCommandsFromPreviousStep: false,
    confirmAddParallelCommandToSteps: false,
    removeParallelCommandFromOtherSteps: false,
    changeParallelCommandParameterInOtherSteps: false,
    preventParallelUsageForDisabledCommands: false,
    activeCommandGroups: false,
  })
}
