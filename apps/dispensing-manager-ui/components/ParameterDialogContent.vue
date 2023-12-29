<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue';
import { colors } from '~/shared/constants';

const props = defineProps({
  joborder: Number,
  plankey: Number,
})

const { t } = useI18n()

const joborder = ref(props.joborder)
const plankey = ref(props.plankey)

const parameterCols = [
  { name: 'joborder', label: t('jobOrderParameters.jobOrderNo'), field: 'joborder' },
  { name: 'parameter', label: t('jobOrderParameters.parameterName'), field: 'parameter' },
  { name: 'value', label: t('jobOrderParameters.value'), field: 'value' },
  { name: 'unit', label: t('jobOrderParameters.unit'), field: 'unit' },
]

const parameterRows = await $fetch(`/api/parameter/parameters?plankey=${plankey.value}`)
</script>

<template>
  <q-card class="column">
    <q-card-section>
      <div class="text-h6 ml-5 mt-5">
        {{ t('jobOrderParameters._') }} - {{ t('joborder') }} :
        <span v-if="joborder">
          {{ joborder }}
        </span>
      </div>
    </q-card-section>

    <q-card-section class="col" style="display: flex;">
      <FilterableTable
        class="ml-5 mr-5 override-class-height"
        :columns="parameterCols"
        :rows="parameterRows"
        style="width: 100%; height: 100%;"
      >
        <template #custombody="props">
          <q-tr
            :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : ''"
          >
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              <span v-if="col.field === 'type'">
                {{ t(`recipeTypes.${col.value}`) }}
              </span>
              <span v-else-if="col.field === 'unit'">
                <span v-if="col.value !== 100">
                  {{ t(`units.${col.value}`) }}
                </span>
              </span>
              <span v-else>
                {{ col.value }}
              </span>
            </q-td>
          </q-tr>
        </template>
      </FilterableTable>
    </q-card-section>

    <q-card-actions align="right" style="position:relative;">
      <q-btn
        v-close-popup
        class="m-2"
        color="secondary"
        flat
        :label="t('close')"
        style="font-size: medium;"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
.override-class-height :deep(.my-sticky-virtscroll-table-recipe) {
  height: 100%;
  margin: 1rem;
}
</style>
