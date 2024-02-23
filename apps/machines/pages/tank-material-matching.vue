<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { deleteTankMaterialMap } from '~/utils'

const { t } = useI18n()

/*
1 kimyasal
2 boya
3 diğer
*/

const selectedMachineId = ref()
const tanksClone = ref()

const { data: machines } = useLazyFetch('/api/machines/active-machines')
const { data: materials } = useLazyFetch('/api/materials/materials')

const { data: tanks, refresh: refreshTanks } = useLazyFetch('/api/materials/material-tank-map', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
  onResponse: ({ response }) => {
    tanksClone.value = JSON.parse(JSON.stringify(response._data))
    tanks.value = response._data
  },
})

function deleteItem(tank, materialCode) {
  tanks.value.find(t => t.tankNo === tank.tankNo)
    .materials = tanks.value.find(t => t.tankNo === tank.tankNo)
      .materials.filter(m => m.materialCode !== materialCode)

  tanksClone.value.find(t => t.tankNo === tank.tankNo)
    .materials = tanksClone.value.find(t => t.tankNo === tank.tankNo)
      .materials.filter(m => m.materialCode !== materialCode)
}

async function handleDragDropMaterials(e, tank) {
  const materialCode = e.item.getAttribute('data-material-code')
  tanksClone.value.find(t => t.tankNo === tank.tankNo)
    .materials.filter(m => m.materialCode !== materialCode)
}

async function handleDragDrop(e, tank) {
  const materialCode = e.item.getAttribute('data-material-code')
  const material = materials.value.find(t => t.materialCode === materialCode)
  console.log('tank, copy', tank, tanksClone.value, material)
  tanksClone.value.find(t => t.tankNo === tank.tankNo).materials.push(material)
}

async function handleSubmit() {
  await $fetch('/api/materials/material-tank-map', {
    method: 'POST',
    body: {
      tankMap: tanksClone.value,
    },
  })
  await refreshTanks()
}
const copy = ref()

function handleCopy() {
  copy.value = JSON.parse(JSON.stringify(tanksClone.value))
}

async function handlePaste() {
  await $fetch('/api/materials/material-tank-map', {
    method: 'POST',
    body: {
      tankMap: copy.value.map(t => ({ ...t, machineId: selectedMachineId.value })),
    },
  })
  await refreshTanks()
}
</script>

<template>
  <q-btn-group push class="flex flex-row ">
    <q-btn
      label="Copy"
      no-caps
      @click="handleCopy"
    />
    <q-btn
      label="Paste"
      no-caps
      @click="handlePaste"
    />
  </q-btn-group>
  <q-card class="flex flex-row justify-around w-full">
    <q-card-section class="flex flex-row w-full justify-start">
      <div class="mr-4 w-xs">
        <h3>{{ t('machines') }}</h3>
        <q-list
          bordered
          separator
          class="q-list q-list--bordered q-list--separator h-160 overflow-y-auto"
        >
          <q-item
            v-for="machine in machines"
            :key="machine.machineId"
            v-ripple
            clickable
            @click="selectedMachineId = machine.machineId"
          >
            <q-item-section>
              {{ machine.machineCode }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="mr-4 w-sm">
        <h3>{{ t('materials') }}</h3>
        <Sortable
          :list="materials"
          :item-key="item => item.materialCode"
          class="q-list q-list--bordered q-list--separator h-160 overflow-y-auto"
          :options="{ group: { name: 'group', pull: 'clone', put: false } }"
          @add="(e) => handleDragDropMaterials(e, tank)"
        >
          <template #item="{ element, index }">
            <q-item
              :key="element.materialCode"
              class="draggable"
              :data-material-code="element.materialCode"
            >
              <q-item-section>
                {{ `${element.materialCode}. ${element.materialName}` }}
              </q-item-section>
            </q-item>
          </template>
        </Sortable>
      </div>
      <!-- tanks -->
      <div v-if="tanks.length" class="flex flex-col w-lg overflow-y-auto h-160">
        <div v-for="tank in tanks" :key="tank">
          <h3>{{ tank.tankName }}</h3>
          <Sortable
            :list="tank.materials"
            :item-key="tank => tank.tankNo"
            class="q-list q-list--bordered q-list--separator"
            :options="{ group: { name: 'group' } }"
            @add="(e) => handleDragDrop(e, tank)"
          >
            <template #item="{ element, index }">
              <q-item
                :key="element.materialId"
                class="draggable"
                :data-material-code="element.materialCode"
              >
                <q-item-section>
                  {{ `${element.materialCode}. ${element.materialName}` }}
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="delete"
                    flat
                    dense
                    @click="deleteItem(tank, element.materialCode)"
                  />
                </q-item-section>
              </q-item>
            </template>
          </Sortable>
        </div>
      </div>
    </q-card-section>
  </q-card>
  <q-btn-group>
    <q-btn @click="handleSubmit">
      Kaydet
    </q-btn>
    <q-btn>İptal</q-btn>
  </q-btn-group>
</template>

<style scoped>

</style>
