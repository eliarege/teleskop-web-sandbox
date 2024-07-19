<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col p-2">
    <div class="flex items-center gap-3 w-full h-full">
      <span>
        <div class="e-border w-5 h-5 bg-blue-600" />
      </span>
      <span>
        {{ t('plan-parameters.legend.default') }}
      </span>
    </div>
    <div class="flex items-center gap-3 w-full h-full">
      <span>
        <div class="e-border w-5 h-5 bg-green-600" />
      </span>
      <span>
        {{ t('plan-parameters.legend.non-start') }}
      </span>
    </div>
    <div class="flex items-center gap-3 w-full h-full">
      <span>
        <div class="e-border w-5 h-5 bg-red-600" />
      </span>
      <span>
        {{ t('plan-parameters.legend.value-invalid') }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
