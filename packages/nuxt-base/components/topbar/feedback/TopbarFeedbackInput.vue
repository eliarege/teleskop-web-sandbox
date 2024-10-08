<script setup lang="ts">
defineProps<{ label: string, readonly: boolean }>()
const text = defineModel('text', { type: String })
const dropdownOpen = ref(false)
</script>

<template>
  <div class="w-full h-min">
    <q-input
      v-model="text"
      dense
      flat
      :readonly
      :label
      borderless
      clearable
      class="border-1 border-gray-300 rounded"
      @focus="() => dropdownOpen = true"
    >
      <template #before>
        <br>
      </template>
      <template #after>
        <slot />
      </template>
    </q-input>
  </div>
</template>

<style scoped lang="postcss">
</style>
