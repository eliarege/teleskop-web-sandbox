<script setup lang="ts">
import type { CommandIO, CommandIOSelection, ioListItem } from '~/shared/types'

const props = defineProps<{
  stepId: number
  parallelIndex: number // -1 for main command, >= 0 for parallel command
  ioIndex: number
  io: CommandIO
  commandNo: number
  ioError?: { type: string, ioIndex?: number, ioName?: string }
}>()

const { t } = useI18n()
const editor = useEditorStore()
const machine = useMachineStore()
const { mt } = useProjectTranslations()
const programIO = editor.getPathElement({
  stepId: props.stepId,
  parallelIndex: props.parallelIndex,
  ioIndex: props.ioIndex,
})

const model = computed({
  get: () => encode(programIO),
  set: (value) => {
    programIO.value = decode(value)
  },
})

const separator = ','
const options = computed(() => (
  props.io.selections.map((selection: CommandIOSelection) => ({
    label: mt(selection.name, machine.currentMachine.id),
    value: `${selection.type}${separator}${selection.physicalId}`,
  }))
))

function encode(values: ioListItem) {
  return values.value.map(value => value.join(separator))
}
function decode(values: string[]) {
  return values.map(value => value.split(separator).map(v => Number.parseInt(v)) as [number, number])
}

const selectedOptionsText = computed(() => {
  const selected = options.value
    .filter(option => model.value.includes(option.value))
    .map(option => `${option.label.substring(0, 6).trim()}.`)

  return selected.length > 0 ? selected.join(', ').slice(0, 24) : t('noSelection')
})
</script>

<template>
  <div class="inline-block align-top">
    <q-select
      v-model="model"
      class="io-select relative text-3 min-w-32 max-w-20 mr-2 mb-1"
      :options="options"
      multiple
      emit-value
      map-options
      dense
      outlined
      stack-label
      options-dense
      hide-bottom-space
      hide-dropdown-icon
      :error="!!props.ioError"
      :label="mt(props.io.name, machine.currentMachine.id)"
    >
      <template #selected>
        <span class="selected-text">
          {{ selectedOptionsText }}
        </span>
      </template>

      <template #option="scope">
        <QItem
          v-bind="scope.itemProps"
          dense
        >
          <QItemSection side>
            <QCheckbox
              :model-value="scope.selected"
              dense
              @update:model-value="scope.toggleOption(scope.opt)"
            />
          </QItemSection>
          <QItemSection>
            {{ scope.opt.label }}
          </QItemSection>
        </QItem>
      </template>
    </q-select>
  </div>
</template>
