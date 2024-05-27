<script setup>
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
