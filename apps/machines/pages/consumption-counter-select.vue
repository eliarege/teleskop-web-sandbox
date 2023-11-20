<script setup lang="ts">
const { data: machines } = await useFetch('/api/command-timeout-reasons/command-map-machines')
</script>

<template>
  <q-card class="flex flex-row justify-center">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="flex flex-col">
      <q-input label="Sayaç 1" />
      <q-input label="Sayaç 2" />
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
