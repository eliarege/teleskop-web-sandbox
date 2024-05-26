<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const programCommand: ProgramStepCommand = editor.getPathElement(props.path)
const isMainCommand = props.path.split('.')[2] === 'mainCommand' ? 0 : 3

const select = ref<QSelect>()
const id = useId()

const { t } = useI18n()

watch(() => select.value?.modelValue, () => {
  if (programCommand.commandNo === null) {
    editor.errorIds.add(id)
    select.value?.focus()
  } else {
    editor.errorIds.delete(id)
  }
})

const rules = [
  (value: any) => !!value,
]

const options = computed(() => (
  Array.from(editor.machineCommands.values())
    .filter(({ commandType }) =>
      (isMainCommand === 0 && commandType === 0)
      || (isMainCommand === 3 && commandType === 0)
      || (isMainCommand === 3 && commandType === 3),
    )
    .map(({ commandNo, name }) => ({
      label: `${commandNo} ${name}`,
      value: commandNo,
    }))
))

const label = computed(() => {
  return !programCommand.commandNo ? t('selectCommand') : undefined
})
</script>

<template>
  <div class="pt-2 pb-2">
    <QSelect
      ref="select"
      :model-value="programCommand.commandNo"
      :options="options"
      :label="label"
      :rules="rules"
      :for="id"
      map-options
      hide-bottom-space
      emit-value
      style="width: 250px"
      options-dense
      outlined
      dense
      auto-close
      @update:model-value="editor.updateCommand(programCommand, $event)"
    >
      <template #no-option>
        <QItem>
          <QItemSection>
            No results
          </QItemSection>
        </QItem>
      </template>
    </QSelect>
  </div>
</template>
