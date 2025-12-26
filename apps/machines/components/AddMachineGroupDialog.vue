<script setup lang="ts">
import type { SortableEvent } from 'sortablejs'
import { Sortable } from 'sortablejs-vue3'
import type { TreatmentMachineGroup } from '~/types'

const props = defineProps<{
  show: boolean
  selected: object
}>()
const emit = defineEmits(['close'])
const { notifyError, notifySuccess } = useNotify()
const kc = useKeycloak()

const { t } = useI18n()

function createEmptyGroup() {
  return {
    id: -1,
    groupName: '',
  }
}

const selected = ref<Partial<TreatmentMachineGroup>>(createEmptyGroup())

const selectedGroupId = ref(-1)

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => ({
    selected: selected.value,
    selectedGroupId: selectedGroupId.value,
  }),
  setState: (state) => {
    selected.value = state?.selected ? { ...state.selected } : createEmptyGroup()
    selectedGroupId.value = state?.selectedGroupId ?? -1
  },
  isOpen: () => props.show,
})

const { data: machineGroups, refresh: refreshGroups } = useAuthFetch('/api/treatment-parameters/machine-groups', {
  default: () => [],
})

const { data: selectedMachines } = useAuthFetch('/api/treatment-parameters/machine-group-machines', {
  default: () => [],
  immediate: false,
  query: {
    groupId: selectedGroupId,
  },
})

const { data: machines } = useAuthFetch('/api/treatment-parameters/available-machines', {
  default: () => [],
  watch: [selectedMachines],
})

async function handleDragDrop(e: SortableEvent) {
  const text: string = e.item.innerHTML
  const matches = text.match(/(\d+) (.+)/)
  if (matches && matches.length) {
    const machineId = Number.parseInt(matches[0])

    try {
      await kc.fetch('/api/treatment-parameters/machine-group-machines', {
        method: 'PUT',
        body: {
          machineId,
          groupId: selectedGroupId.value,
          action: e.type,
        },
      })
      // Show success message
      const notify = useNotify()
      if (e.type === 'add') {
        notify.notifySuccess(t('MACHINE_ADDED_TO_GROUP_SUCCESSFULLY'))
      } else if (e.type === 'remove') {
        notify.notifySuccess(t('MACHINE_REMOVED_FROM_GROUP_SUCCESSFULLY'))
      }
    } catch (error: any) {
      const notify = useNotify()
      if (error.statusCode === 409) {
        notify.notifyError(t('MACHINE_GROUP_MAPPING_ALREADY_EXISTS'))
      } else if (error.statusCode === 404) {
        notify.notifyError(t('MACHINE_GROUP_MAPPING_NOT_FOUND'))
      } else if (error.statusCode === 400) {
        notify.notifyError(t('INVALID_ACTION'))
      } else {
        notify.notifyError(t('TREATMENT_MAP_ERROR'))
      }
    }
  }
}

async function handleAdd() {
  try {
    await kc.fetch('/api/treatment-parameters/machine-group', {
      method: 'POST',
      body: selected.value,
    })
    await refreshGroups()
    selected.value = createEmptyGroup()
    selectedGroupId.value = -1
    notifySuccess(t('GROUP_CREATED_SUCCESSFULLY'))
    markSaved()
  } catch (error: any) {
    if (error.statusCode === 409) {
      notifyError(t('GROUP_ALREADY_EXISTS'))
    } else {
      notifyError(t('GROUP_ADD_ERROR'))
    }
  }
}
async function handleEdit() {
  try {
    await kc.fetch('/api/treatment-parameters/machine-group', {
      method: 'PUT',
      body: selected.value,
    })
    await refreshGroups()
    notifySuccess(t('GROUP_UPDATED_SUCCESSFULLY'))
    markSaved()
  } catch (error: any) {
    if (error.statusCode === 409) {
      notifyError(t('GROUP_ALREADY_EXISTS'))
    } else {
      notifyError(t('GROUP_UPDATE_ERROR'))
    }
  }
}
async function handleDelete() {
  try {
    await kc.fetch('/api/treatment-parameters/machine-group', {
      method: 'DELETE',
      body: selected.value,
    })
    await refreshGroups()
    selected.value = createEmptyGroup()
    selectedGroupId.value = -1
    notifySuccess(t('GROUP_DELETED_SUCCESSFULLY'))
    markSaved()
  } catch (error: any) {
    if (error.statusCode === 404) {
      notifyError(t('GROUP_NOT_FOUND'))
    } else {
      notifyError(t('GROUP_DELETE_ERROR'))
    }
  }
}
async function handleGroupClick(obj: TreatmentMachineGroup) {
  selected.value = obj
  selectedGroupId.value = obj.id
  markSaved()
}

function handleCancel() {
  requestClose(() => emit('close'))
}
</script>

<template>
  <q-dialog
    :model-value="props.show"
    :persistent="hasChanges"
    @hide="emit('close')"
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
            <q-btn
              no-caps
              :label="t('cancel')"
              outline
              color="secondary"
              @click="handleCancel"
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
                <template #item="{ element }">
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
                <template #item="{ element }">
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

  <ConfirmDialog
    v-model="confirmVisible"
    :title="t('unsavedChanges.title')"
    :message="t('unsavedChanges.message')"
    :cancel-label="t('unsavedChanges.continue')"
    :confirm-label="t('unsavedChanges.discard')"
    confirm-color="negative"
    @confirm="confirmDiscard"
    @cancel="keepEditing"
  />
</template>

<style scoped>
.input-field > * {
  margin-right: 1em;
}
</style>
