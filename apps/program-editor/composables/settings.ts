import type { ProgramWriteSettings } from '~/shared/types'

export const useProgramWriteSettings = createGlobalState(() => {
  const kc = useKeycloak()
  const app = useAppProps()
  const storage = useLocalStorage<Record<string, ProgramWriteSettings>>(`${app.name}.programWriteSettings`, {})
  const username = computed(() => {
    return kc.tokenParsed.value?.preferred_username || 'guest'
  })

  const settings = ref(defaultSettings())

  watch(username, (uname) => {
    if (!storage.value[uname]) {
      storage.value[uname] = defaultSettings()
    }
    Object.assign(settings.value, storage.value[uname])
  }, { immediate: true })

  watch(settings, () => {
    Object.assign(storage.value[username.value], settings.value)
  }, { deep: true })

  return settings
})

function defaultSettings(): ProgramWriteSettings {
  return {
    addParallelCommandsFromPreviousStep: false,
    confirmAddParallelCommandToSteps: false,
    removeParallelCommandFromOtherSteps: false,
    changeParallelCommandParameterInOtherSteps: false,
    preventParallelUsageForDisabledCommands: false,
    activeCommandGroups: false,
  }
}
