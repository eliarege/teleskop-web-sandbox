<script setup lang="ts">
const { data: machineGroups, pending } = await useFetch('/api/machines/machine-groups')

const columns = [
  {
    name: 'groupId',
    label: 'Grup Adı',
    field: row => row.groupId,
    align: 'left',
  },
  {
    name: 'groupName',
    label: 'Grup Adı',
    field: row => row.groupName,
    align: 'left',
  },
  {
    name: 'groupType',
    label: 'Grup Tipi',
    field: row => row.groupType,
    align: 'left',
  },
]
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
      />
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
