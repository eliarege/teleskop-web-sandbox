<script setup lang="ts">
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import type { MachineGroup } from '~/types'

const kc = useKeycloak()
const { t } = useI18n()
const { notifySuccess, notifyError } = useNotify()

const { data: machineGroups, pending, refresh } = await useAuthFetch<readonly MachineGroup[]>('/api/machines/machine-groups', {
  default: () => [],
})

const columns = computed<FilterableTableColumn[]>(() => ([
  {
    name: 'groupName',
    label: t('group'),
    field: (row: MachineGroup) => row.groupName,
    align: 'left',
  },
  {
    name: 'groupType',
    label: t('groupType'),
    field: (row: MachineGroup) => row.groupType,
    align: 'left',
  },
]))

const machineGroupTypeMapper = {
  0: 'Kumaş HT',
  1: 'Kumaş OF',
  2: 'Bobin',
  3: 'Numune',
  4: 'Flok',
  5: 'Yıkama',
  6: 'Yıkama Boyama',
  7: 'Kurutma',
  9: 'Diğer',
}

const machineGroupTypeOptions = [
  {
    groupType: 0,
    groupName: 'Kumaş HT',
  },
  {
    groupType: 1,
    groupName: 'Kumaş OF',
  },
  {
    groupType: 2,
    groupName: 'Bobin',
  },

  {
    groupType: 3,
    groupName: 'Numune',
  },

  {
    groupType: 4,
    groupName: 'Flok',
  },

  {
    groupType: 5,
    groupName: 'Yıkama',
  },

  {
    groupType: 6,
    groupName: 'Yıkama Boyama',
  },

  {
    groupType: 7,
    groupName: 'Kurutma',
  },

  {
    groupType: 9,
    groupName: 'Diğer',
  },
]

const changedGroups = ref<MachineGroup[]>([])
const showRenameDialog = ref(false)
const renameLoading = ref(false)
const selectedGroupId = ref<number>()
const groupNameInput = ref('')

async function handleMachineGroupSelect(e: Omit<MachineGroup, 'groupId'>, group: MachineGroup) {
  group.groupType = e.groupType
  changedGroups.value.push(group)
}

function handleRenameClick(group: MachineGroup) {
  selectedGroupId.value = group.groupId
  groupNameInput.value = group.groupName
  showRenameDialog.value = true
}

function closeRenameDialog() {
  showRenameDialog.value = false
  selectedGroupId.value = undefined
  groupNameInput.value = ''
}

async function handleGroupRename() {
  if (selectedGroupId.value == null) {
    return
  }

  const groupName = groupNameInput.value.trim()
  if (!groupName) {
    return
  }

  try {
    renameLoading.value = true
    const response = await kc.fetch<{ message?: string }>('/api/machines/machine-group-rename', {
      method: 'PUT',
      body: { id: selectedGroupId.value, groupName },
    })
    notifySuccess(t(response?.message || 'GROUP_UPDATED_SUCCESSFULLY'))
    closeRenameDialog()
    await refresh()
  } catch (error: any) {
    notifyError(t(error?.data?.statusMessage || 'errorOccurred'))
  } finally {
    renameLoading.value = false
  }
}

async function handleSubmit() {
  await kc.fetch('/api/machines/machine-group-types', { method: 'PUT', body: { changedGroups: changedGroups.value } })
  await refresh()
  changedGroups.value = []
}
</script>

<template>
  <q-card>
    <q-card-section>
      <q-table
        :loading="pending"
        :rows="machineGroups"
        :columns="columns"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="groupId"
        separator="cell"
        bordered
        table-header-class="table-header"
      >
        <template #body-cell-groupName="props">
          <q-td :props="props">
            <div class="row items-center justify-between full-width no-wrap">
              <span>{{ props.row.groupName }}</span>
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="edit"
                @click="handleRenameClick(props.row)"
              />
            </div>
          </q-td>
        </template>
        <template #body-cell-groupType="props">
          <q-td :props="props">
            <q-select
              :model-value="machineGroupTypeMapper[props.row.groupType as keyof typeof machineGroupTypeMapper]"
              :options="machineGroupTypeOptions"
              option-label="groupName"
              option-value="groupType"
              @update:model-value="(e) => handleMachineGroupSelect(e, props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card-section>
    <q-dialog v-model="showRenameDialog" @keyup.esc="closeRenameDialog">
      <q-card style="min-width: 360px;">
        <q-card-section class="pb-2">
          <div class="text-h6">
            {{ t('edit') }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="groupNameInput"
            :label="t('machineGroupName')"
            autofocus
            @keyup.enter="handleGroupRename"
            @keyup.esc="closeRenameDialog"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            no-caps
            :label="t('cancel')"
            @click="closeRenameDialog"
          />
          <q-btn
            color="primary"
            no-caps
            :loading="renameLoading"
            :disable="!groupNameInput.trim()"
            :label="t('save')"
            @click="handleGroupRename"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-card-actions align="right" class="mt-4 mr-4">
      <q-btn
        no-caps
        :label="t('cancel')"
        @click="$router.go(0)"
      />
      <q-btn
        color="primary"
        no-caps
        :label="t('submit')"
        @click="handleSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
:deep(.table-header > th) {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}

.input-field > * {
  margin-right: 2em;
}
</style>
