<script setup lang="ts">
const jobOrderMaterials = ref(JSON.parse(sessionStorage.getItem('jobOrderMaterials')))
const jobOrderParams = ref(JSON.parse(sessionStorage.getItem('jobOrderParams')))
const jobOrderMachines = ref(JSON.parse(sessionStorage.getItem('jobOrderMachines')))
const jobOrderRecipeParams = ref(JSON.parse(sessionStorage.getItem('jobOrderRecipeParams')))
</script>

<template>
  <JobOrderOverview
    :steps="jobOrderMaterials"
    :params="jobOrderParams"
    :machines="jobOrderMachines"
    :recipe-params="jobOrderRecipeParams"
  />
</template>
