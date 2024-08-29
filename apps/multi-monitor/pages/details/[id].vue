<script setup lang="ts">
import { LoadingSpinner } from '@teleskop/ui'
import type { BatchLogs, MachineDataRaw, NewBatchLogs, NewInterventions } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

definePageMeta({
  noAuth: true,
})
const store = useDataStore()
const route = useRoute()

const currentMachine = computed(() => store.machines.find(machine => machine.id === Number.parseInt(route.params.id as string)) as MachineDataRaw)

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
</script>

<template>
  <div v-if="currentMachine" class="flex justify-center">
    <MachineDetails
      :current-machine="currentMachine!"
      :intervents="interventions"
    />
  </div>
</template>
