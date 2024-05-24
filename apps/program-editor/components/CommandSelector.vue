<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const programCommand: ProgramStepCommand = editor.getPathElement(props.path)
const isMainCommand = props.path.split('.')[2] === 'mainCommand' ? 0 : 3

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
  return !programCommand.commandNo ? 'Komut Seçiniz' : undefined
})
const rules = [
  (value: string) => Number.isNaN(value) || 'Komut Seçiniz',
]
</script>

<template>
  <div class="pt-2 pb-2">
    <QSelect
      :model-value="programCommand.commandNo"
      :options="options"
      map-options
      :label="label"
      emit-value
      style="width: 250px"
      options-dense
      outlined
      dense
      auto-close
      :rules="rules"
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
