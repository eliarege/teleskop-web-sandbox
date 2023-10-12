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

const parameterRows = await $fetch(`/api/parameter/parameters?plankey=${plankey.value}`)
console.log(parameterRows)
</script>

<template>
  <q-card class="column">
    <q-card-section>
      <div class="text-h6 ml-5 mt-5">
        {{ t('jobOrderParameters.a') }} - {{ t('joborder') }} :
        <span v-if="joborder">
          {{ joborder }}
        </span>
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
