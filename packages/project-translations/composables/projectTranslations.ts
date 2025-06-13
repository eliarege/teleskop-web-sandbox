export function useMachineTranslations() {
  const { t } = useI18n()

  return {
    mt(value: string, machineId = 0) {
      return t(`mt.${machineId}.${value}`, value)
    },
  }
}
