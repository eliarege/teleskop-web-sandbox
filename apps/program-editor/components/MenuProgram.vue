<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '~/composables/editor'
import { useNotify } from '~/composables/notify'

const { t } = useI18n()
const editor = useEditorStore()
const { notifySuccess, notifyError } = useNotify()

async function onSubmit() {
  const firstId = [...editor.errorIds][0]
  if (firstId) {
    const el = document.getElementById(firstId)
    const parentEl = el?.closest('.q-item__section--main')
    const button = parentEl?.querySelector('button')

    if (button?.children[1].children[0].innerHTML === 'expand_more')
      button.click()

    setTimeout(() => {
      el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }, 100)

    notifyError(t('saveProgram.incorrect'))
  } else {
    if (await editor.updateProgram()) {
      notifySuccess(t('saveProgram.success'))
    } else {
      notifyError(t('saveProgram.fail'))
    }
  }
}

function onReset() {
  window.location.reload()
}
</script>

<template>
  <div>
    <QBtn
      :label="t('menu.save')"
      flat
      @click="onSubmit"
    />
    <QBtn
      :label="t('menu.reset')"
      flat
      @click="onReset"
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
