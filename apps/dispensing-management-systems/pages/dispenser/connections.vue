<script lang = "ts" setup>
import type { Dispenser } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const dataStore = useDataStore()
const route = useRoute()
const load = ref(false)
if (!dataStore.selectedDispenser) {
  const { data: dispenser } = await useFetch<Dispenser>(`/api/dispensers/${route.query.dispenserId}`)
  if (!dispenser.value || dispenser.value?.dispenserId < 0) {
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
  <DispenserConnections
    v-if="load"
    :dispenser-id="Number(route.query.dispenserId)"
  />
</template>
