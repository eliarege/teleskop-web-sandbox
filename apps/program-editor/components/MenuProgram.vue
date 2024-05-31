<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { QBtn } from 'quasar'
import { useEditorStore } from '~/composables/editor'

const props = defineProps<{
  vis: boolean
  path?: string
}>()

const { t } = useI18n()
const editor = useEditorStore()
const route = useRoute()
const router = useRouter()
const isDisable = ref(false)

const type = computed(() => props.path?.split('/').reverse().find((x) => {
  if (x === 'new')
    return 'new'
  if (x === 'program')
    return 'program'
  if (x === 'machine')
    return 'machine'
  return undefined
}))

const buttons = [
  { label: 'menu.save', action: 'save' },
  { label: 'menu.reset', action: 'reset' },
  { label: 'menu.newStep', action: 'newStep' },
  { label: 'menu.newParallelStep', action: 'newParallelStep', condition: 'selectedStep' },
  { label: 'menu.deleteStep', action: 'deleteStep', condition: 'selectedStep' },
  { label: 'menu.deleteParallelStep', action: 'deleteParallelStep', condition: 'selectedParallelStep' },
]

function getDisableStatus(button: { label: string, action: string, condition?: string }) {
  if (isDisable.value) {
    return true
  }
  if (button.condition) {
    if (button.condition === 'selectedStep') {
      return editor.selectedStep === -1
    }
    if (button.condition === 'selectedParallelStep') {
      return editor.selectedParallelStep === -1
    }
  }
  return false
}

function handleButton(btn: string) {
  isDisable.value = true

  switch (btn) {
    case 'save':
      editor.onSubmit()
      break
    case 'reset':
      editor.onReset()
      break
    case 'newStep':
      editor.newStep()
      break
    case 'newParallelStep':
      editor.newParallelStep()
      break
    case 'deleteStep':
      editor.deleteStep()
      break
    case 'deleteParallelStep':
      editor.deleteParallelStep()
      break
  }

  setTimeout(() => {
    isDisable.value = false
  }, 1000)
}
</script>

<template>
  <div v-if="props.vis && type === 'machine'">
    <QBtn
      :label="t('menu.newProgram')"
      flat
      @click="router.push(`/machine/${route.params.machine_id}/program/new`)"
    />
    <QBtn
      :label="t('menu.editProgram')"
      flat
      :disable="editor.selectedRow === -1"
      @click="router.push(`/machine/${route.params.machine_id}/program/${editor.selectedRow}`)"
    />
  </div>

  <div v-if="props.vis && type === 'program'" class="flex">
    <div v-for="(button, index) in buttons" :key="index">
      <QBtn
        :label="t(button.label)"
        flat
        :disable="getDisableStatus(button)"
        @click="handleButton(button.action)"
      />
    </div>
  </div>
  <QSpace else />
</template>

<style scoped>
.q-btn {
  text-transform: capitalize;
}
</style>
