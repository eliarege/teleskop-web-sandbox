<script setup lang="ts">
defineProps<({
  title: string
  details: string[]
})>()

const expanded = ref(false)
</script>

<template>
  <div>
    <div class="cursor-pointer font-bold flex w-full" @click="expanded = !expanded">
      {{ title }}
      <q-space />
      <q-icon
        :name="expanded ? 'expand_less' : 'expand_more'"
        size="xs"
        class="q-ml-sm"
      />
    </div>
    <div v-if="expanded" class="q-mt-sm text-body2 flex flex-row max-h-80 max-w-120 overflow-y-auto">
      <span
        v-for="(detail, index) of details"
        :key="detail"
        class="w-full"
      >
        {{ `${index + 1} - ${detail}` }}
      </span>
    </div>
  </div>
</template>
