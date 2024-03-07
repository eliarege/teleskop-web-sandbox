<script setup lang="ts">
import { defineProps } from 'vue'

interface ButtonProps {
  label: string
  color?: string
  icon?: string
}

const props = defineProps({
  bodyText: {
    type: String,
  },
  confirmBtn: {
    type: Object as () => ButtonProps,
    required: true,
  },
  cancelBtn: {
    type: Object as () => ButtonProps,
    required: true,
  },
})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
</script>

<template>
  <QDialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <QCard>
      <QCardSection class="row items-center">
        <span class="q-ml-sm"> {{ t(`${props.bodyText}`) }}</span>
      </QCardSection>

      <QCardActions align="right">
        <QBtn
          v-close-popup
          outline
          :label="t(`${props.confirmBtn.label}`)"
          :color="props.confirmBtn.color"
          :icon="props.confirmBtn.icon"
          @click="onDialogOK"
        />
        <QBtn
          v-close-popup
          :label="t(`${props.cancelBtn.label}`)"
          outline
          :color="props.cancelBtn.color"
          :icon="props.cancelBtn.icon"
          @click="onDialogCancel"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<style scoped lang="postcss">
</style>
