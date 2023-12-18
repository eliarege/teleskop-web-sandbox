<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'

/*
1 kimyasal
2 boya
3 diğer
*/

const selectedMachineId = ref()

const { data: machines } = useLazyFetch('/api/command-timeout-reasons/command-map-machines')
const { data: materials } = useLazyFetch('/api/materials/materials')

const { data: tanks } = useLazyFetch('/api/tank-definitions/tank-definitions', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>

      <div class="h-sm overflow-y-scroll">
        <h3>Komutlar</h3>
        <Sortable
          :list="materials"
          item-key="id"
          class=""
          :options="{ group: 'group' }"
        >
          <template #item="{ element, index }">
            <div
              :key="element.materialCode"
              class="draggable"
            >
              {{ `${element.materialCode} ${element.materialName}` }}
            </div>
          </template>
        </Sortable>
      </div>
      <!-- tanks -->
      <div v-if="tanks.length">
        <div v-for="tank in tanks" :key="tank">
          <h3>{{ tank.name }}</h3>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
