<script setup lang="ts">
const props = defineProps({
  vis: Boolean,
  comparisonObjects: Array<any>,
})
const emit = defineEmits(['update:vis'])
const { t } = useI18n()
const selectedOption = ref(0)

function closeDialog() {
  emit('update:vis', false)
}
function handle() {
  emit('update:vis', false)
}
</script>

<template>
  <q-card>
    <q-card-section class="row items-center">
      <span class="q-ml-sm"> {{ t('contextMenu') }}</span>
    </q-card-section>
    <q-card-section>
      <div class="flex items-center justify-center" />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        v-close-popup
        :label="t('cancel')"
        outline
        color="black"
        icon="close"
        @click="closeDialog"
      />
      <q-btn
        v-close-popup
        outline
        :label="t('change')"
        @click="handle"
      />
    </q-card-actions>
  </q-card>
</template>
