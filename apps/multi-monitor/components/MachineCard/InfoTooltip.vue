<script setup lang="ts">
interface InfoTooltipProps {
  planKey: number
  recipeIndex: number
  programNo: number
}
const props = defineProps<InfoTooltipProps>()

const { data, status } = await useFetch('/api/recipeStep', {
  method: 'GET',
  query: props,
})
</script>

<template>
  <div v-if="status === 'pending'" class="w-full h-full flex-center min-w-20 min-h-20">
    <LoadingSpinner :with-wrapper="false" />
  </div>
  <div v-for="(item, idx) in data" :key="idx">
    <div>
      {{ item.materialName }}
      {{ item.amount.toFixed(2).replace(/\.?0+$/, '') }}
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
