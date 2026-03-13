<script setup lang="ts">
interface InfoTooltipProps {
  planKey: number
  recipeIndex: number
  programNo: number
}
const props = defineProps<InfoTooltipProps>()
const { t } = useI18n()
const { data, status } = await useFetch('/api/recipeStep', {
  method: 'GET',
  query: props,
})
</script>

<template>
  <div v-if="status === 'pending'" class="w-full h-full flex-center min-w-20 min-h-20">
    <LoadingSpinner :with-wrapper="false" />
  </div>
  <div v-if="data.length === 0">
    {{ t('no-material-in-step') }}
  </div>
  <div v-else>
    <div v-for="(item, idx) in data" :key="idx">
      <div>
        <span class="font-500">{{ item.materialName }}:</span>
        {{ item.amount.toFixed(2).replace(/\.?0+$/, '') }} gr
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
