<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'action'])

const { t } = useI18n()

const menuModel = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

function emitAction(action: 'stepDetails') {
  emit('action', action)
  emit('update:modelValue', false)
}
</script>

<template>
  <q-menu
    v-model="menuModel"
    context-menu
  >
    <q-list dense style="min-width: 200px">
      <q-item clickable @click="emitAction('stepDetails')">
        <q-item-section>{{ t('stepDetails') }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
