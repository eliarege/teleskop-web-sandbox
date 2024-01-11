<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { deleteTankMaterialMap } from '~/utils'

/*
1 kimyasal
2 boya
3 diğer
*/

const selectedMachineId = ref()

const { data: machines } = useLazyFetch('/api/command-timeout-reasons/command-map-machines')
const { data: materials } = useLazyFetch('/api/materials/materials')

const { data: tanks, refresh: refreshTanks } = useLazyFetch('/api/materials/material-tank-map', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleDragDrop(e, tank) {
  const text = e.item.innerHTML
  const matches = text.split('. ')
  if (matches && matches.length) {
    const materialCode = matches[0]
    if (e.type === 'add') {
      await addTankMaterialMap({
        machineId: selectedMachineId.value,
        tank,
        materialCode,
      })
      await refreshTanks()
    } else if (e.type === 'remove') {
      deleteItem(tank, materialCode)
    }
  }
}

async function deleteItem(tank, materialCode: string) {
  await deleteTankMaterialMap({
    machineId: selectedMachineId.value,
    tank,
    materialCode,
  })
  await refreshTanks()
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
        <h3>Materyaller</h3>
        <Sortable
          :list="materials"
          item-key="id"
          class="q-list q-list--bordered q-list--separator"
          :options="{ group: { name: 'group', pull: 'clone', put: false } }"
        >
          <template #item="{ element, index }">
            <q-item
              :key="element.materialCode"
              class="draggable"
            >
              <q-item-section>
                {{ `${element.materialCode}. ${element.materialName}` }}
              </q-item-section>
            </q-item>
          </template>
        </Sortable>
      </div>
      <!-- tanks -->
      <div v-if="tanks.length" class="flex flex-row">
        <div v-for="tank in tanks" :key="tank">
          <h3>{{ tank.tankName }}</h3>
          <Sortable
            :list="tank.materials"
            item-key="id"
            class="q-list q-list--bordered q-list--separator"
            :options="{ group: { name: 'group' } }"
            @add="(e) => handleDragDrop(e, tank)"
            @remove="(e) => handleDragDrop(e, tank)"
          >
            <template #item="{ element, index }">
              <q-item
                :key="element.id"
                class="draggable"
              >
                <q-item-section>
                  {{ `${element.materialCode}. ${element.materialName}` }}
                </q-item-section>
                <button @click="deleteItem(tank, element.materialCode)">
                  x
                </button>
              </q-item>
            </template>
          </Sortable>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
