<script setup lang="ts">
const props = defineProps<{
  isDeviation?: boolean
  fabricColor: boolean
  modelValue?: string
  title: string
}>()
const emit = defineEmits(['update:modelValue'])
const color = ref(props.modelValue)

watch(color, useDebounceFn(() => {
  emit('update:modelValue', color.value)
}, 1000))
</script>

<template>
  <div class="grid grid-cols-2 gap-10 min-h-40px items-center">
    <span>
      {{ title }}
    </span>
    <div class="flex justify-end items-center mr-1px">
      <q-field
        dense
        flat
        filled
        borderless
        class="test w-1.125rem h-1.125rem"
        :model-value="color"
      >
        <q-popup-proxy
          transition-show="scale"
          transition-hide="scale"
          anchor="top right"
        >
          <q-color
            v-model="color"
          />
        </q-popup-proxy>
      </q-field>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.test :deep(.q-field__inner) {
  background-color: v-bind(color);
  border-radius: 3px;
  @apply overflow-hidden;
}
</style>
