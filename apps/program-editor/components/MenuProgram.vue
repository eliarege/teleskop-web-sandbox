<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { QBtn } from 'quasar'
import { useEditorStore } from '~/composables/editor'

const props = defineProps<{
  vis: boolean
  type?: string
}>()

const { t } = useI18n()
const editor = useEditorStore()
const route = useRoute()
const router = useRouter()
</script>

<template>
  <div v-if="props.vis && props.type === 'programs'">
    <QBtn
      :label="t('menu.newProgram')"
      flat
      @click="router.push(`/machine/${route.params.machine_id}/program/new`)"
    />
    <QBtn
      :label="t('menu.editProgram')"
      flat
      :disable="editor.selectedRows.length <= 0"
      @click="router.push(`/machine/${route.params.machine_id}/program/${editor.selectedRows[0].programNo}`)"
    />
  </div>

  <div v-if="props.vis && props.type === 'editor'">
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
  <QSpace else />
</template>

<style scoped>
.q-btn {
  text-transform: capitalize;
}
</style>
