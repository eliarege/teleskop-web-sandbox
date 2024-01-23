<script lang="ts" setup>
import { useDataStore } from '~/store/DataStore'

const { t } = useI18n()
const dataStore = useDataStore()

dataStore.title = t('AddMOD')
</script>

<template>
  <div class="q-pa-md flex-center">
    <MachinesNDispensers />
  </div>
</template>
