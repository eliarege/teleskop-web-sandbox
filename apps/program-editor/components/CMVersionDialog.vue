<script setup lang="ts">
const props = defineProps({
  rows: Array<any>,
  machineId: Number,
  programNo: Number,
})
const emit = defineEmits(['update:vis', 'onDeleteClick'])
const deleteVersionDialogVis = ref(false)
const selectedRows = ref([])
const isMoreThanOneRowSelected = computed(() => selectedRows.value.length > 1)
const { t } = useI18n()
const columns = [
  { name: 'version', label: t('contextMenu.version._'), field: 'version' },
  { name: 'name', label: t('contextMenu.version.programName'), field: 'name', tooltip: true },
  { name: 'changedDate', label: t('contextMenu.version.startDate'), field: 'changedDate' },
  { name: 'stepCount', label: t('contextMenu.version.stepCount'), field: 'stepCount' },
]

function closeDialog() {
  emit('update:vis', false)
}
async function handleDelete() {
  emit('onDeleteClick', selectedRows.value)
}

const ctrl = useKeyModifier('Control')
function isRowSelected(row: any) {
  return selectedRows.value.includes(row)
}
function removeSelection(row: any) {
  selectedRows.value = selectedRows.value.filter(r => r !== row)
}
async function onRowClick(row: any, isRightClick?: boolean) {
  if (ctrl.value) {
    if (isRowSelected(row)) {
      if (!isRightClick)
        removeSelection(row)
    } else
      selectedRows.value.push(row)
  } else if (!(isRowSelected(row) && isRightClick))
    selectedRows.value = [row]
}
</script>

<template>
  <div class="w-full h-full bg-white">
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.version.header') }}</span>
      </q-card-section>
      <q-card-section>
        <q-table
          :columns="columns"
          :rows="props.rows"
          :pagination="{ rowsPerPage: 10 }"
          class="flex h-100 w-200 text-override-left"
          row-key="id"
        >
          <template #body="bodyProps">
            <q-tr
              :props="bodyProps"
              :class="{ 'e-selected': isRowSelected(bodyProps.row) }"
              @click="onRowClick(bodyProps.row)"
            >
              <q-td
                v-for="col in bodyProps.cols"
                :key="col.field"
                :props="bodyProps"
                class="max-w-20 overflow-hidden"
              >
                {{ col.value }}
                <QTooltip
                  v-if="col.tooltip"
                  class="bg-white text-black e-border text-sm"
                  :transition-duration="0"
                  :delay="500"
                >
                  {{ col.value }}
                </QTooltip>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('contextMenu.version.showInEditor')"
          outline
          color="black"
          :disable="isMoreThanOneRowSelected"
        />
        <q-btn
          :label="t('contextMenu.version.compare')"
          outline
          :disable="!isMoreThanOneRowSelected"
          color="black"
        />
        <q-btn
          :label="t('contextMenu.version.makeDefault')"
          outline
          color="black"
          :disable="isMoreThanOneRowSelected"
        />
        <q-btn
          v-close-popup
          outline
          :label="t('delete')"
          color="red"
          icon="delete"
          :disable="!selectedRows.length"
          @click="deleteVersionDialogVis = true"
        />
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="closeDialog"
        />
      </q-card-actions>
    </q-card>
    <q-dialog v-model="deleteVersionDialogVis">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="delete"
          />
          <span class="q-ml-sm"> {{ t('contextMenu.deleteVersionDialog.warning', { code: selectedRows.map(e => e.version).sort() }) }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('cancel')"
            outline
            color="black"
            icon="close"
          />
          <q-btn
            v-close-popup
            outline
            :label="t('delete')"
            color="red"
            icon="delete"
            @click="handleDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
</style>
