<script lang="ts" setup>
import { useDataStore } from '~/store/DataStore'

const { t } = useI18n()
const dataStore = useDataStore()

dataStore.title = t('DispensersAndMachines')
</script>

<template>
  <div class="q-pa-md flex-center">
    <MachineOverview />
  </div>
</template>
