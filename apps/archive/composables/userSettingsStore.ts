import { defineStore } from 'pinia'
import type { Axis, IOSetting } from '~/types/archive'

export const userSettingsStore = defineStore('settings', () => {
  const machineId = ref()
  const settings = ref(new Map<string, IOSetting>())
  settings.value.set('DEFAULT', { color: '', selected: true, axis: '\'C' })
  const alarmSettings = ref<Array<number>>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  const tooltipSettings = ref<Array<number>>([1, 2, 3, 4, 5, 6, 7, 8])
  const showAllAlarms = ref(true)
  const showGraphTooltip = ref(true)
  const units = ref([] as Array<string>)
  const axises = ref(new Map<string, Axis>())
  const bottomChartVisibilityStatus = ref(0)
  /**
   * 0 = Show graph
   *  1 = Show digital IO lines
   *  2 = Show cycle times graph
   */

  function setSetting(id: string, color: string, selected: boolean, axis: string) {
    settings.value.set(id, { color, selected, axis })
  }
  function getSetting(id: string) {
    const setting = settings.value.get(id)
    if (!setting) {
      settings.value.set(id, { color: '', selected: false })
    }
    return settings.value.get(id)!
  }

  function updateSetting(id: string, setting: Partial<IOSetting>) {
    const current = settings.value.get(id)
    if (current)
      Object.assign(current, setting)
  }
  function updateAxis(id: string, axis: Partial<Axis>) {
    const current = axises.value.get(id)
    if (current)
      Object.assign(current, axis)
  }
  function createAxis(name: string, unit: string, ioKeys: Array<string>) {
    axises.value.set(name, {
      visible: false,
      name,
      color: '',
      ioKeys,
      max: 0,
      unit,
      isDefault: false,
    })
  }
  function getCommandColor(id: number, key: string): string {
    const uid = `${key}_${id}`
    const setting = getSetting(uid)
    return setting?.color || '#FFFFFF'
  }
  function updateAlarmSettings(newSettings: Array<number>) {
    alarmSettings.value = newSettings
  }
  function updateTooltipSettings(newSettings: Array<number>) {
    tooltipSettings.value = newSettings
  }
  function setShowAllAlarms(value: boolean) {
    showAllAlarms.value = value
  }
  function getAllAlarmsChecked() {
    return showAllAlarms.value
  }
  function updateChartState() {
    bottomChartVisibilityStatus.value = (bottomChartVisibilityStatus.value + 1) % 3
  }
  function hasUserSettings() {
    return !!localStorage.getItem(`userSettings.machine${machineId.value}`)
  }
  function initializeSettings() {
    const userSettings = JSON.parse(localStorage.getItem(`userSettings.machine${machineId.value}`) || '{}')
    if (userSettings.settings) {
      settings.value = new Map(Object.entries(userSettings.settings))
    }
    if (userSettings.alarmSettings) {
      alarmSettings.value = userSettings.alarmSettings
    }
    if (userSettings.tooltipSettings) {
      tooltipSettings.value = userSettings.tooltipSettings
    }
    if (typeof userSettings.showAllAlarms === 'boolean') {
      showAllAlarms.value = userSettings.showAllAlarms
    }
    if (typeof userSettings.showGraphTooltip === 'boolean') {
      showGraphTooltip.value = userSettings.showGraphTooltip
    }
    if (userSettings.units) {
      units.value = userSettings.units
    }
    if (userSettings.axises) {
      axises.value = new Map(Object.entries(userSettings.axises))
      for (const axis of axises.value.values()) {
        axis.max = 0
      }
    }
    if (bottomChartVisibilityStatus) {
      bottomChartVisibilityStatus.value = userSettings.bottomChartVisibilityStatus || 0
    }
    return userSettings
  }

  function saveSettings() {
    const userSettings = {
      settings: Object.fromEntries(settings.value),
      alarmSettings: alarmSettings.value,
      tooltipSettings: tooltipSettings.value,
      showAllAlarms: showAllAlarms.value,
      showGraphTooltip: showGraphTooltip.value,
      units: units.value,
      axises: Object.fromEntries(axises.value),
      bottomChartVisibilityStatus: bottomChartVisibilityStatus.value,
    }
    localStorage.setItem(`userSettings.machine${machineId.value}`, JSON.stringify(userSettings))
  }

  window.addEventListener('beforeunload', () => {
    saveSettings()
  })

  return {
    settings,
    axises,
    units,
    initializeSettings,
    hasUserSettings,
    bottomChartVisibilityStatus,
    updateChartState,
    tooltipSettings,
    updateTooltipSettings,
    machineId,
    setSetting,
    createAxis,
    updateAxis,
    getSetting,
    updateSetting,
    getCommandColor,
    alarmSettings,
    showAllAlarms,
    updateAlarmSettings,
    setShowAllAlarms,
    getAllAlarmsChecked,
    showGraphTooltip,
  }
})
