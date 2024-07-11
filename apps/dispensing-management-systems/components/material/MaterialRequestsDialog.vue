<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { useDialogPluginComponent } from 'quasar'
import type { JobOrder, MaterialRequest } from '~/shared/types'
import { useColorStore } from '~/store/Colors'

const props = defineProps({
  jobOrder: {
    type: Object as PropType<JobOrder>,
    required: true,
  },
})
const q = useQuasar()
const { t } = useI18n()
const colorStore = useColorStore()
const { dialogRef, onDialogHide } = useDialogPluginComponent()

const columns: (QTableColumn<MaterialRequest>)[] = [
  { name: 'materialCode', label: t('materialFields.Code'), field: 'materialCode', align: 'left' },
  { name: 'materialName', label: t('materialFields.Name'), field: 'materialName', align: 'left' },
  { name: 'amount', label: t('materialFields.Amount'), field: 'recipeAmount', align: 'left' },
  { name: 'status', label: t('statusCodes.text'), field: 'status', align: 'left' },
]

const materials = ref<MaterialRequest[]>([])
getMaterials()
async function getMaterials() {
  materials.value = await $fetch(`/api/materials/requests`, { query: { jobId: props.jobOrder.jobId } })
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <QTable
        flat
        bordered
        separator="cell"
        :title="t('MaterialRequests')"
        :columns
        :rows="materials"
        row-key="name"
      >
        <template #body-cell="material">
          <QTd
            :props="material"
            :style="cellStyle(material.col, material.row, material.pageIndex, false, q.dark.isActive, colorStore.colors)"
          >
            <span v-if="material.col.field === 'status'">
              {{ t(`statusCodes.${material.value}`) }}
            </span>
            <span v-else-if="material.col.field === 'amount'">
              {{ `${material.value} (${t(`units.${material.row.unit}`)})` }}
            </span>
            <span v-else>
              {{ material.value }}
            </span>
          </QTd>
        </template>
      </QTable>
    </QCard>
  </QDialog>
</template>

<style scoped lang="postcss">

</style>
