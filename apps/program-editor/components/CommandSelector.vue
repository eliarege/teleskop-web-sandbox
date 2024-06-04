<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { COMMAND_TYPE } from '~/shared/constants'

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

onUnmounted(() => {
  editor.errorIds.delete(id)
})

const rules = [
  (value: any) => !!value,
]

const options = computed(() => (
  Array.from(editor.machine.commands.values())
    .filter(({ commandType }) =>
      (isMainCommand === COMMAND_TYPE.MAIN && commandType === COMMAND_TYPE.MAIN)
      || (isMainCommand === COMMAND_TYPE.PARALLEL && commandType === COMMAND_TYPE.MAIN)
      || (isMainCommand === COMMAND_TYPE.PARALLEL && commandType === COMMAND_TYPE.PARALLEL),
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
  <div>
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
            {{ t('selectCommand') }}
          </QItemSection>
        </QItem>
      </template>
    </QSelect>
  </div>
</template>
