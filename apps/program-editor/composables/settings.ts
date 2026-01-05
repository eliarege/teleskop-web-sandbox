import { TeleskopSettingsIds } from '~/shared/constants'
import type { ProgramWriteSettings, TeleskopSettings } from '~/shared/types'

export type TeleskopSettingsStore = ReturnType<typeof useTeleskopSettingsStore>

export const useTeleskopSettingsStore = defineStore('teleskop-settings', () => {
  const kc = useKeycloak()

  const initialTemperature = ref(25)
  const selectedIcons = ref(0)
  const treatmentSettings = reactive({
    optimizedEnable: false,
    optimizedLimit: 10,
  })

  /**
   * Teleskop ayarlarını alır ve teleskopSettings değişkenine atar.
   *
   * Bu fonksiyon, sunucudan teleskop ayarlarını almak için bir API çağrısı yapar ve
   * alınan ayarları `teleskopSettings` reaktif değişkenine atar.
   * API yanıtı alındıktan sonra, bu ayarlar bileşen içinde kullanılabilir hale gelir.
   *
   * @returns {Promise<void>} Promise döner ve asenkron bir işlem olduğunu belirtir.
   */
  async function fetchTeleskopSettings(): Promise<void> {
    const result = await kc.fetch<TeleskopSettings>('/api/teleskop-settings', { method: 'GET' })

    initialTemperature.value = result.initialTemperature
    selectedIcons.value = result.selectedIcons
    treatmentSettings.optimizedEnable = result.treatmentSettings.optimizedEnable
    treatmentSettings.optimizedLimit = result.treatmentSettings.optimizedLimit
  }

  /**
   * Teleskop ayarlarını günceller ve API'ye gönderir.
   *
   * @param {TeleskopSettingsIds} id - Güncellenmek istenen ayarın ID'si.
   * @param {string} value - Ayar için yeni değer. Değer türüne bağlı olarak uygun şekilde işlenir.
   *
   * @returns {Promise<void>} Güncelleme işlemi tamamlandığında çözümlenen bir promise döner.
   *
   * @description Bu fonksiyon, verilen ayar kimliğine göre teleskop ayarlarını günceller ve yapılan değişikliği API'ye gönderir.
   */
  async function updateTeleskopSettings(id: TeleskopSettingsIds, value: string | number | boolean): Promise<void> {
    await kc.fetch<void>('/api/teleskop-settings', {
      method: 'PUT',
      body: { id, value: String(value) },
    })

    switch (id) {
      case TeleskopSettingsIds.OPTIMIZED_ENABLE:
        treatmentSettings.optimizedEnable = Boolean(value)
        break
      case TeleskopSettingsIds.OPTIMIZED_LIMIT:
        treatmentSettings.optimizedLimit = Number(value)
        break
      case TeleskopSettingsIds.SELECTED_ICONS:
        selectedIcons.value = Number(value)
        break
      case TeleskopSettingsIds.INITIAL_TEMPERATURE:
        initialTemperature.value = Number(value)
        break
    }
  }

  return {
    initialTemperature: readonly(initialTemperature),
    selectedIcons: readonly(selectedIcons),
    treatmentSettings: readonly(treatmentSettings),
    fetchTeleskopSettings,
    updateTeleskopSettings,
  }
})

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
    addParallelCommandsFromPreviousStep: true,
    confirmAddParallelCommandToSteps: true,
    removeParallelCommandFromOtherSteps: true,
    changeParallelCommandParameterInOtherSteps: false,
    preventParallelUsageForDisabledCommands: false,
    activeCommandGroups: false,
  }
}
