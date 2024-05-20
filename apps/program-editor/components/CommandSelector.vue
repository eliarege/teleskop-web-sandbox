<script setup lang="ts">
import type { ParameterItem, ProgramStepCommand, ioListItem } from '~/shared/types'

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

function updateCommand() {
  const machineCommand = editor.machineCommands.get(programCommand.commandNo)

  if (machineCommand) {
    programCommand.commandNo = machineCommand.commandNo

    programCommand.parameters = machineCommand.parameters
      .filter(parameter => parameter.editable)
      .map(parameter => ({
        index: parameter.index,
        value: parameter.defaultValue,
      }))

    programCommand.ioList = machineCommand.ioList
      .filter(io => io.selectable)
      .map(io => ({
        ioId: io.physicalId,
        ioIndex: io.index,
        value: io.selections
          .filter(selection => selection.defaultValue)
          .map(selection => [selection.type, selection.physicalId]),
      }))
  }
}
</script>

<template>
  <div class="pt-2 pb-2">
    <QSelect
      v-model="programCommand.commandNo"
      :options="options"
      map-options
      emit-value
      style="width: 250px"
      options-dense
      outlined
      dense
      auto-close
      @update:model-value="updateCommand"
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
