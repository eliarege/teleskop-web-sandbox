<script setup lang="ts">
const url = useRouter()
url.replace('?thumb')
const count = ref(false)
</script>

<template>
  <div class="w-full h-screen">
    <TimeBased v-if="count" />
    <QueueBased v-else />
  </div>
</template>
