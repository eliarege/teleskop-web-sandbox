<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: () => t('app.name'),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
