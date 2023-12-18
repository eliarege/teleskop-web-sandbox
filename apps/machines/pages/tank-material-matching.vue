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

const { data: tanks } = useLazyFetch('/api/materials/material-tank-map', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
  transform: (tanks) => {
    const groups = new Map()
    for (const tank of tanks) {
      const key = `${tank.machineId}-${tank.tankNo}`
      if (!groups.has(key)) {
        groups.set(key, {
          tankNo: tank.tankNo,
          tankName: tank.tankName,
          materials: [],
          mapId: tank.id,
        })
      }
      const group = groups.get(key)
      group.materials.push(tank)
    }
    return [...groups.values()]
  },
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="flex flex-row">
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
      <div v-if="tanks.length" class="flex flex-row">
        <div v-for="tank in tanks" :key="tank">
          <h3>{{ tank.tankName }}</h3>
          <div v-if="tank.mapId !== null">
            <div v-for="material in tank.materials" :key="material.id">
              {{ material.materialName }}
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
