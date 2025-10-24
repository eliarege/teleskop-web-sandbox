<script lang="ts" setup>
const route = useRoute()
</script>

<template>
  <RecipeInfo
    :batch-no="route.query.batchNo"
    :correction-no="route.query.correctionNo"
    :machine-id="route.query.machineId"
  />
</template>
