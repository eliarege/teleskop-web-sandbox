<script setup lang="ts">
const route = useRoute()

const batchNo = computed(() => {
  const value = route.query.batchNo
  if (Array.isArray(value))
    return value[0] || null
  return typeof value === 'string' ? value : null
})
</script>

<template>
  <JobOrderOverview
    v-if="batchNo"
    :batch-no="batchNo"
  />
  <div v-else class="print-view__missing">
    <p>No job order reference was provided. Please reopen this page from a job order action.</p>
  </div>
</template>

<style scoped>
.print-view__missing {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #4b5563;
}
</style>
