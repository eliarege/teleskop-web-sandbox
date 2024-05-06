<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { TreatmentMachineGroup } from '~/types'

const props = defineProps<{
  show: boolean
  selected: object
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const selected = ref<Partial<TreatmentMachineGroup>>({
  id: -1,
  groupName: '',
})

const selectedGroupId = ref(-1)

const { data: machineGroups, refresh: refreshGroups } = useLazyFetch('/api/treatment-parameters/machine-groups', {
  default: () => [],
})

const { data: selectedMachines } = useLazyFetch('/api/treatment-parameters/machine-group-machines', {
  default: () => [],
  immediate: false,
  query: {
    groupId: selectedGroupId,
  },
})

const { data: machines } = useLazyFetch('/api/treatment-parameters/available-machines', {
  default: () => [],
  watch: [selectedMachines],
})

async function handleDragDrop(e) {
  const text: string = e.item.innerHTML
  const matches = text.match(/(\d+) (.+)/)
  if (matches && matches.length) {
    const machineId = Number.parseInt(matches[0])

    await $fetch('/api/treatment-parameters/machine-group-machines', {
      method: 'PUT',
      body: {
        machineId,
        groupId: selectedGroupId.value,
        action: e.type,
      },
    })
  }
}

async function handleAdd() {
  await $fetch('/api/treatment-parameters/machine-group', {
    method: 'POST',
    body: selected.value,
  })
  await refreshGroups()
}
async function handleEdit() {
  await $fetch('/api/treatment-parameters/machine-group', {
    method: 'PUT',
    body: selected.value,
  })
  await refreshGroups()
}
async function handleDelete() {
  await $fetch('/api/treatment-parameters/machine-group', {
    method: 'DELETE',
    body: selected.value,
  })
  await refreshGroups()
  selected.value = {
    id: -1,
    groupName: '',
  }
}
async function handleGroupClick(obj: TreatmentMachineGroup) {
  selected.value = obj
  selectedGroupId.value = obj.id
}
</script>

<template>
  <q-dialog
    :model-value="show"
    @hide="$emit('close')"
  >
    <q-card class="min-w-[1000px]">
      <q-card-section class="flex flex-col">
        <div>
          <q-input
            v-model="selected.groupName"
            filled
            :placeholder="t('machineGroupName')"
            class="w-md"
          />
          <div class="flex gap-4 my-4">
            <q-btn
              no-caps
              :label="t('add')"
              @click="handleAdd"
            />
            <q-btn
              no-caps
              :label="t('edit')"
              :disable="selected.id === -1"
              @click="handleEdit"
            />
            <q-btn
              no-caps
              :label="t('delete')"
              :disable="selected.id === -1"
              @click="handleDelete"
            />
          </div>
        </div>

        <div class="flex flex-row gap-x-8">
          <div class="w-60">
            <h3>{{ t('machineGroups') }}</h3>
            <q-list bordered separator>
              <q-item
                v-for="machineGroup in machineGroups"
                :key="machineGroup.id"
                v-ripple
                clickable
                :active="selected === machineGroup"
                :focused="selected === machineGroup"
                @click="handleGroupClick(machineGroup)"
              >
                <q-item-section>
                  {{ machineGroup.groupName }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="flex flex-row">
            <div class="mr-8">
              <h3>{{ t('availableMachines') }}</h3>
              <Sortable
                :list="machines"
                item-key="id"
                class="q-list q-list--bordered q-list--separator overflow-y-auto h-120 w-60"
                :options="{ group: 'group' }"
              >
                <template #item="{ element, index }">
                  <q-item
                    :key="element.machineId"
                    class="draggable"
                  >
                    <q-item-section>
                      {{ `${element.machineId} ${element.machineCode}` }}
                    </q-item-section>
                  </q-item>
                </template>
              </Sortable>
            </div>
            <div>
              <h3>{{ t('machinesOfSelectedGroup') }}</h3>
              <Sortable
                :list="selectedMachines"
                item-key="id"
                class="q-list q-list--bordered q-list--separator overflow-y-auto h-120 w-60"
                :options="{ group: 'group' }"
                @add="(e) => handleDragDrop(e)"
                @remove="(e) => handleDragDrop(e)"
              >
                <template #item="{ element, index }">
                  <q-item
                    :key="element"
                    class="draggable"
                  >
                    <q-item-section>
                      {{ `${element.machineId} ${element.machineCode}` }}
                    </q-item-section>
                  </q-item>
                </template>
              </Sortable>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.input-field > * {
  margin-right: 1em;
}
</style>
