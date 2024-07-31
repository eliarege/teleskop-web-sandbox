<script setup lang="ts">
const props = defineProps({
  machineId: Number,
  programNo: Number,
})

const versionDialogVisible = ref(false)
const comparisonDialogVisible = ref(false)

const { t } = useI18n()
</script>

<template>
  <div class="w-full h-full">
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.newVersion.header') }}</span>
      </q-card-section>
      <q-card-section>
        <q-table
          :columns="columns"
          :rows="rows"
          :pagination="{ rowsPerPage: 10 }"
          class="flex h-100 w-200 text-override-left"
          row-key="id"
        >
          <template #body="bodyProps">
            <q-tr
              :props="bodyProps"
              @click="versionDialogVisible = true"
            >
              <q-td
                key="version"
                :props="bodyProps"
              >
                {{ bodyProps.row.version }}
              </q-td>
              <q-td
                key="name"
                :props="bodyProps"
              >
                {{ bodyProps.row.name }}
              </q-td>
              <q-td
                key="changedDate"
                :props="bodyProps"
              >
                {{ bodyProps.row.changedDate }}
              </q-td>
              <q-td
                key="stepCount"
                :props="bodyProps"
              >
                {{ bodyProps.row.stepCount }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>
