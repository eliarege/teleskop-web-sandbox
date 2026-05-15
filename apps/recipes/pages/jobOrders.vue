<script lang = "ts" setup>
import type { Dispenser } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const dataStore = useDataStore()
const route = useRoute()
const load = ref(false)
const id = route.query.dispenserId
if (!dataStore.selectedDispenser && id) {
  const { data: dispenser } = await useFetch<Dispenser>(`/api/dispensers/${id}`)
  if (!dispenser.value || Number.parseInt(id.toString()) < 0) {
    navigateTo({
      path: '/',
    })
  } else {
    dataStore.selectedDispenser = dispenser.value
    dataStore.title = dispenser.value.dispenserName
    load.value = true
  }
} else {
  load.value = true
}
</script>

<template>
  <div>
    <JobOrderList v-if="load" />
    <NuxtPage />
  </div>
</template>
