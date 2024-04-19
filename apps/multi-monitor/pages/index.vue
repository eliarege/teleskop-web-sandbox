<script setup lang="ts">
import { useDataStore } from '~/store/Datas'
import type { MachineData } from '~/shared/types'

const { t } = useI18n()
const { notify } = useQuasar()
const store = useDataStore()
/* Dismiss notification box */
let dismiss = null as (() => void) | null

const { start: scheduleNext } = useTimeoutFn(async () => {
  await store.fetchMachineData()
  scheduleNext()
}, 5000)

watch(() => store.fetchMachineError, (error) => {
  if (error && !dismiss) {
    dismiss = notify({
      position: 'top',
      color: 'negative',
      spinner: true,
      message: t('machine-status-server-unavailable'),
      timeout: 0,
    })
  } else if (!error && dismiss) {
    dismiss()
    dismiss = null
  }
})

const machineData = computed(() => {
  return store.machines.map((machine) => {
    return {
      ...machine,
      runningStartTime: machine.runningStartTime
        ? new Date(machine.runningStartTime)
        : null,
      stopReasonDateTime: new Date(machine.stopReasonDateTime),
      manualReasonDateTime: new Date(machine.stopReasonDateTime),
      runningStartHour:
        machine.runningStartTime === null
          ? '-'
          : `${machine.runningStartTime?.slice(
              5,
              -14,
            )} ${machine.runningStartTime?.slice(11, -5)}` || null,
      loggedInOperatorName: machine.loggedInOperatorName
        ? machine.loggedInOperatorName
        : t('teleskop.machine-stop-notification'),
      runningJobOrder: machine.runningJobOrder ? machine.runningJobOrder : ' ',
      runningProgramName: machine.runningProgramName
        ? machine.runningProgramName
        : ' ',
      runningProgramList: machine.runningProgramList
        ? machine.runningProgramList
        : ' ',
      runningCommandName: machine.runningCommandName
        ? machine.runningCommandName
        : ' ',
      runningAlarmName: machine.runningAlarmName
        ? machine.runningAlarmName
        : ' ',
      runningPhaseName: machine.runningPhaseName
        ? machine.runningPhaseName
        : ' ',
      newTheoreticalDuration: machine.theoreticalDuration
        ? machine.theoreticalDuration
        : 1,
      stopReason: machine.stopReason ? machine.stopReason : ' ',
      manualReason: machine.manualReason ? machine.manualReason : ' ',
      runningAlarmNo: machine.runningAlarmNo ? machine.runningAlarmNo : ' ',
    } as MachineData
  })
})
const formatter = ref('YYYY-MM-DD HH:mm:ss')
const formatted = useDateFormat(useNow(), formatter)
</script>

<template>
  <div class="touch-none select-none">
    <TheProduction :formatted="formatted" :machine-data="machineData" />
  </div>
</template>

<style scoped lang="postcss"></style>
