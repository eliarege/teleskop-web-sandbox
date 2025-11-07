<script setup lang="ts">
const jobOrderMaterials = ref(JSON.parse(sessionStorage.getItem('jobOrderMaterials') || 'null'))
const jobOrderParams = ref(JSON.parse(sessionStorage.getItem('jobOrderParams') || 'null'))
const jobOrderMachines = ref(JSON.parse(sessionStorage.getItem('jobOrderMachines') || 'null'))
const jobOrderRecipeParams = ref(JSON.parse(sessionStorage.getItem('jobOrderRecipeParams') || 'null'))
const jobOrderBatchNo = ref(JSON.parse(sessionStorage.getItem('jobOrderBatchNo') || 'null'))

sessionStorage.removeItem('jobOrderMaterials')
sessionStorage.removeItem('jobOrderParams')
sessionStorage.removeItem('jobOrderMachines')
sessionStorage.removeItem('jobOrderRecipeParams')
sessionStorage.removeItem('jobOrderBatchNo')
</script>

<template>
  <JobOrderOverview
    v-if="jobOrderMaterials"
    :steps="jobOrderMaterials"
    :params="jobOrderParams"
    :machines="jobOrderMachines"
    :recipe-params="jobOrderRecipeParams"
  />
  <JobOrderOverview
    v-else-if="jobOrderBatchNo"
    :batch-no="jobOrderBatchNo"
  />
</template>
