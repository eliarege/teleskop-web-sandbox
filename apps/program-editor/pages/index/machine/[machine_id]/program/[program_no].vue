<script setup lang="ts">
import { QForm, useQuasar } from 'quasar'
import { LoadingSpinner } from 'ui'
import ProgramEditor from '~/components/ProgramEditor.vue'
import ProgramTitle from '~/components/ProgramTitle.vue'
import { useEditorStore } from '~/composables/editor'

const editor = useEditorStore()
const { locale } = useI18n()
const { dark } = useQuasar()
const form = ref<QForm>()
const route = useRoute()

const machineId = Number(route.params.machine_id)
const programNo = Number(route.params.program_no)

watch(locale, () => {
  form.value?.validate()
})

await editor.fetchMachineCommands(machineId)
await editor.fetchProgram(machineId, programNo)

/*
  TODO: Save, Reset, NewStep, NewParallelStep, DeleteStep, DeleteParallelStep
*/
</script>

<template>
  <div>
    <div v-if="editor.isLoading" class="absolute w-full h-full top-1/2 left-1/2 transform -translate-1/2">
      <LoadingSpinner />
    </div>
    <div>
      <QForm
        ref="form"
        class="q-gutter-md"
      >
        <div
          class="p-3 rounded-lg flex justify-center items-center"
          :class="dark.isActive ? 'bg-dark-2' : 'bg-gray-1'"
        >
          <ProgramTitle
            :program="{
              machineId: editor.program?.machineId || 0,
              machineName: editor.program?.machineName || '',
              programNo: editor.program?.programNo || 0,
              name: editor.program?.name || '',
            }"
          />
        </div>
        <div class="mb-130">
          <ProgramEditor />
        </div>
      </QForm>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
body {
  user-select: none;
}
</style>
