<script setup lang="ts">
import LoadingSpinner from 'ui/components/LoadingSpinner.vue'
import type { BatchLogs, MachineDataRaw, NewBatchLogs, NewInterventions } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const route = useRoute()

const currentMachine = computed(() => store.machine.find(machine => machine.id === Number.parseInt(route.params.id as string)) as MachineDataRaw)

const { data: intervents } = useFetch('/api/interventions', {
  query: { interventParam: route.params.id },
  default: () => [],
})
const interventions = computed(() => {
  return intervents.value.map((intervents) => {
    return {
      ...intervents,
      newTime: intervents.interventTime
        ? intervents.interventTime.slice(11, -5)
        : intervents.interventTime,
    } as NewInterventions
  })
})
const config = useRuntimeConfig()
const batchLogs = ref([] as BatchLogs[])
async function getBatchLogs() {
  if (config.public.teleskopHasLogs === 'true') {
    batchLogs.value = await $fetch('/api/machine_logs', {
      query: { machineId: route.params.id },
    })
  }
}
const refactoredBatchLogs = computed(() => {
  return batchLogs.value
    ?.filter(machine => machine.planKey)
    .map((logs) => {
      return {
        ...logs,
        newTime: logs.eventTime
          ? logs.eventTime.toString().slice(0, -5).replace('T', ' ')
          : logs.eventTime,
      }
    }) as NewBatchLogs[] || []
})

onMounted(async () => {
  await getBatchLogs()
})
</script>

<template>
  <div v-if="currentMachine" class="flex justify-center">
    <MachineDetails
      :current-machine="currentMachine!"
      :intervents="interventions"
      :log-data="refactoredBatchLogs"
    />
  </div>
</template>
