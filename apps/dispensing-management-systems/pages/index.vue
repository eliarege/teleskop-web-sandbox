<script lang="ts" setup>
import { useDataStore } from '~/store/DataStore'

const dataStore = useDataStore()

dataStore.title = ''
</script>

<template>
  <div class="q-pa-md flex-center mt-50">
    <MainMenu />
  </div>
</template>
