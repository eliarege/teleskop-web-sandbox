<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '~/composables/editor'

const { t } = useI18n()
const editor = useEditorStore()
</script>

<template>
  <div>
    <QBtn
      :label="t('menu.save')"
      flat
      @click="editor.onSubmit"
    />
    <QBtn
      :label="t('menu.reset')"
      flat
      @click="editor.onReset"
    />
    <QBtn
      :label="t('menu.newStep')"
      flat
      @click="editor.newStep"
    />
    <QBtn
      :label="t('menu.newParallelStep')"
      flat
      :disabled="editor.selectedStep === -1"
      @click="editor.newParallelStep"
    />
    <QBtn
      :label="t('menu.deleteStep')"
      flat
      :disabled="editor.selectedStep === -1"
      @click="editor.deleteStep()"
    />
    <QBtn
      :label="t('menu.deleteParallelStep')"
      flat
      :disable="editor.selectedParallelStep === -1"
      @click="editor.deleteParallelStep()"
    />
  </div>
</template>

<style scoped>
.q-btn {
  text-transform: capitalize;
}
</style>
