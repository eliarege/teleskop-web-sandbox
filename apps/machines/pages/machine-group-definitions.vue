<script setup lang="ts">
const { data: machineGroups, pending, refresh } = await useFetch('/api/machines/machine-groups')

const { t } = useI18n()

const columns = computed(() => ([
  {
    name: 'groupName',
    label: t('group'),
    field: row => row.groupName,
    align: 'left',
  },
  {
    name: 'groupType',
    label: t('groupType'),
    field: row => row.groupType,
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

async function handleMachineGroupSelect(e, group) {
  group.groupType = e.groupType
  await editMachineGroupType(group)
  await refresh()
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
              :model-value="machineGroupTypeMapper[props.row.groupType]"
              :options="machineGroupTypeOptions"
              option-label="groupName"
              option-value="groupType"
              @update:model-value="(e) => handleMachineGroupSelect(e, props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card-section>
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
