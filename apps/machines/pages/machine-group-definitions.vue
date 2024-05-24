<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { MachineGroup } from '~/types'

const { t } = useI18n()

const { data: machineGroups, pending, refresh } = await useFetch<readonly MachineGroup[]>('/api/machines/machine-groups', {
  default: () => [],
})

const columns = computed<Column[]>(() => ([
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

async function handleMachineGroupSelect(e: Exclude<MachineGroup, 'groupId'>, group: MachineGroup) {
  group.groupType = e.groupType
  changedGroups.value.push(group)
}

async function handleSubmit() {
  await $fetch('/api/machines/machine-group-types', { method: 'PUT', body: { changedGroups: changedGroups.value } })
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
        row-key="groupNo"
        separator="cell"
        bordered
        table-header-class="table-header"
      >
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
