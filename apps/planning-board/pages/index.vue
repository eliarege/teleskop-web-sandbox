<script setup lang="ts">
const url = useRouter()
url.replace('?thumb')
</script>

<template>
  <div class="w-full h-screen">
    <PlanningScheduler />
  </div>
</template>
