<script setup lang="ts">
const url = useRouter()
url.replace('?thumb')
const { data: state } = await useFetch('/api/ptStatus')
</script>

<template>
  <div class="w-full h-screen">
    <TimeBased v-if="Number.parseInt(state || '0') === 1" />
    <QueueBased v-else />
  </div>
</template>
