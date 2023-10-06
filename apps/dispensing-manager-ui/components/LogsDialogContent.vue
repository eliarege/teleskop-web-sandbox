<script setup lang="ts">
import { useI18n } from 'vue-i18n'

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
  { name: 'type', label: t('jobOrderParameters.type'), field: 'type' },
  { name: 'value', label: t('jobOrderParameters.value'), field: 'value' },
  { name: 'unit', label: t('jobOrderParameters.unit'), field: 'unit' },
]
const checkboxesStatus = ref([
  { value: false, label: t('jobOrderLogs.newRequest') },
  { value: false, label: t('jobOrderLogs.forwardDistributor') },
  { value: false, label: t('jobOrderLogs.startedDistributingWeighing') },
  { value: false, label: t('jobOrderLogs.completedDistributingWeighing') },
  { value: false, label: t('jobOrderLogs.canceledDistributingWeighing') },
  { value: false, label: t('jobOrderLogs.priorityChange') },
  { value: false, label: t('jobOrderLogs.changedDistributor') },
  { value: false, label: t('jobOrderLogs.faultyOther') },
])

const checkboxesRecipeType = ref([
  { value: false, label: t('chemical') },
  { value: false, label: t('dye') },
])

const checkboxesProgramIndex = ref([
  { value: false, label: '1' },
  { value: false, label: '2' },
  { value: false, label: t('jobOrderLogs.other') },
])
const { data: parameterRows } = await useFetch(`/api/parameter/parameters?plankey=${plankey.value}`)
console.log(parameterRows.value)
</script>

<template>
  <q-card class="column">
    <div class="text-h6 ml-7 mt-3">
      {{ t('jobOrderParameters.a') }} - {{ t('joborder') }} :
      <span v-if="joborder">
        {{ joborder }}
      </span>
    </div>
    <q-card-section class="flex flex-col ml-5">
      <div class="h-60 flex flex-row gap-5">
        <div class="flex flex-col e-border" style="width: 15%;">
          <q-checkbox
            v-for="(element, index) in checkboxesStatus"
            :key="index"
            v-model="element.value"
            class="custom-checkboxes"
            :label="element.label"
          />
        </div>
        <div class="flex flex-col e-border" style="width: 15%;">
          <q-checkbox
            v-for="(element, index) in checkboxesRecipeType"
            :key="index"
            v-model="element.value"
            class="custom-checkboxes"
            :label="element.label"
          />
        </div>
        <div class="flex flex-col e-border" style="width: 15%;">
          <q-checkbox
            v-for="(element, index) in checkboxesProgramIndex"
            :key="index"
            v-model="element.value"
            class="custom-checkboxes"
            :label="element.label"
          />
        </div>
        <div class="flex flex-col gap-5" style="width: 15%;">
          <q-select
            filled
            :label="t('jobOrderLogs.arrangementCriterion')"
          />
          <q-select
            filled
            :label="t('jobOrderLogs.arrangementSort')"
          />
        </div>
      </div>
    </q-card-section>

    <q-card-section class="col" style="display: flex;">
      <q-table
        class="text-override-left ml-5 mr-5 my-sticky-virtscroll-table-recipe "
        :columns="parameterCols"
        :rows="parameterRows"
        :rows-per-page-options="[0]"
        style="width: 100%; height: 100%;"
        virtual-scroll
        flat
        bordered
        :virtual-scroll-sticky-size-start="48"
      />
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
.custom-checkboxes :deep(.q-checkbox__inner) {
    font-size: 60px;
    width: 2rem;
    min-width: 2rem;
    height: 2rem;
    outline: 0;
    border-radius: 50%;
}
.custom-checkboxes :deep(.q-checkbox__bg) {
    top: 20%;
    left: 20%;
    width: 60%;
    height: 60%;
    border: 2px solid currentColor;
    border-radius: 2px;
}
.my-sticky-virtscroll-table-recipe {
  height: 410px;
}

.my-sticky-virtscroll-table-recipe :deep(.q-table__top),
.my-sticky-virtscroll-table-recipe :deep(.q-table__bottom),
.my-sticky-virtscroll-table-recipe :deep(thead tr:first-child th) {
  background-color: #dddddd;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr th) {
  position: sticky;
  z-index: 1;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr:last-child th) {
  top: 48px;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr:first-child th) {
  top: 0;
}

.my-sticky-virtscroll-table-recipe :deep(tbody) {
  scroll-margin-top: 48px;
}
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
</style>
