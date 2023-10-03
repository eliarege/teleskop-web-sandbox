<script setup lang="ts">
import type { BatchLogs, MachineDataRaw, NewInterventions } from '~/shared/types'
import { useDataStore } from '~/store/Datas'
import LoadingSpinner from 'ui/components/LoadingSpinner.vue'

definePageMeta({
  layout: 'teleskop',
})

const store = useDataStore()
const route = useRoute()

const currentMachine = computed(() => store.machine.find(machine => machine.id === Number.parseInt(route.params.id as string)) as MachineDataRaw)

const { data: intervents } = await useFetch('/api/interventions', {
  query: { interventParam: route.params.id },
})
const interventions = computed(() => {
  if (!intervents.value) {
    return null
  } else
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
    const res = await $fetch('/api/machine_logs', {
      query: { machineId: route.params.id },
    })
    batchLogs.value = res
  }
}
const refactoredBatchLogs = computed(() => batchLogs.value
  ? batchLogs.value.filter(machine => machine.planKey).map((logs) => {
    return {
      ...logs,
      newTime: logs.eventTime
        ? logs.eventTime.toString().slice(0, -5).replace('T', ' ')
        : logs.eventTime,
    }
  })
  : [])
onMounted(async () => {
  await getBatchLogs()
})
</script>

<template>
  <Suspense>
    <div class="flex justify-center">
      <MachineDetails
        :current-machine="currentMachine!"
        :intervents="interventions!"
        :log-data="refactoredBatchLogs"
      />
    </div>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
