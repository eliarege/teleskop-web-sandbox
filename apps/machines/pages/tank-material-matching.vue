<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { klona } from 'klona'
import type { Machine, Material, TankDefinition } from '~/types'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'

const { t } = useI18n()

/*
1 kimyasal
2 boya
3 diğer
*/

const selectedMachineId = ref()
const tanksClone = ref<TankDefinition[]>()

const { data: machines } = useLazyFetch<Machine[]>('/api/machines/active-machines')
const { data: materials } = useLazyFetch<Material[]>('/api/materials/materials')

const { data: tanks, refresh: refreshTanks } = useLazyFetch('/api/materials/material-tank-map', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
  onResponse: ({ response }) => {
    tanksClone.value = klona(response._data)
  },
})

function deleteItem(tank: TankDefinition, materialCode: string) {
  tanks.value.find(t => t.tankNo === tank.tankNo)
    .materials = tanks.value.find(t => t.tankNo === tank.tankNo)
      .materials.filter((m: Material) => m.materialCode !== materialCode)

  if (tanksClone.value && tanksClone.value.length) {
    tanksClone.value.find((t: TankDefinition) => t.tankNo === tank.tankNo)!
      .materials = tanksClone.value.find((t: TankDefinition) => t.tankNo === tank.tankNo)!
        .materials.filter((m: Material) => m.materialCode !== materialCode)
  }
}

async function handleDragDrop(e: any, tank: TankDefinition) {
  const materialCode = e.item.getAttribute('data-material-code')
  if (materials.value && tanksClone.value) {
    const material = materials.value.find(t => t.materialCode === materialCode)
    if (material)
      tanksClone.value.find(t => t.tankNo === tank.tankNo)!.materials.push(material)
  }
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

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: !selectedMachineId.value,
    onClick: () => {
      copy.value = klona(tanksClone.value)
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      await $fetch('/api/materials/material-tank-map', {
        method: 'POST',
        body: {
          tankMap: copy.value.map((t: TankDefinition) => ({ ...t, machineId: selectedMachineId.value })),
        },
      })
      await refreshTanks()
    },
  },
])
</script>

<template>
  <ContextMenu
    :context-menu-options="contextMenuOptions"
    target=".q-list"
    @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)"
  />
  <div>
    <q-card>
      <q-card-section class="flex flex-row justify-around w-full">
        <div class="flex flex-row w-full justify-start">
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
                :active="selectedMachineId === machine.machineId"
                :focused="selectedMachineId === machine.machineId"
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
              :list="materials!"
              :item-key="item => item.materialCode"
              class="q-list q-list--bordered q-list--separator h-160 overflow-y-auto"
              :options="{ group: { name: 'group', pull: 'clone', put: false } }"
            >
              <template #item="{ element }">
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
                <template #item="{ element }">
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
        </div>
      </q-card-section>
      <q-card-actions align="right" class="m-4">
        <q-btn no-caps :label="t('cancel')" />
        <q-btn
          no-caps
          color="primary"
          :label="t('submit')"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style scoped>

</style>
