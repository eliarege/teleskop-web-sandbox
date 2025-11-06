<script setup lang="ts">
import type { CommandIO, CommandIOSelection, ioListItem } from '~/shared/types'

const props = defineProps<{
  path: string
  io: CommandIO
  commandNo: number
  ioError?: { type: string, ioIndex?: number, ioName?: string }
}>()

const { t } = useI18n()
const editor = useEditorStore()
const { mt } = useProjectTranslations()
const config = useRuntimeConfig()
const programIO: ioListItem = editor.getPathElement(props.path)

const model = computed({
  get: () => encode(programIO),
  set: (value) => {
    programIO.value = decode(value)
  },
})

const separator = ','
const options = computed(() => (
  props.io.selections.map((selection: CommandIOSelection) => ({
    label: mt(selection.name, editor.machine.id),
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
    <DevOnly v-if="config.public.showDevOnly">
      <div class="color-gray-5 text-3">
        {{ props.commandNo }} - {{ props.io.index }}
      </div>
    </DevOnly>

    <div
      class="q-input-border border-[rgba(0,0,0,0.24)] border-1 mr-1 mb-1"
      :class="{ 'border-red border-2': props.ioError }"
    >
      <div class="relative pt-4 text-3 min-w-32 max-w-40">
        <div class="q-input-text">
          {{ mt(props.io.name, editor.machine.id) }}
        </div>
        <div class="option-text">
          {{ selectedOptionsText }}
        </div>
        <div
          class="option-group"
        >
          <QOptionGroup
            v-model="model"
            :options="options"
            type="checkbox"
            class="pt-1"
            dense
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
/* Mock quasar css for q-field */
.q-input-text {
  transform: translateY(-30%) scale(0.75);
  font-size: 14px;
  left: 0px;
  top: 10px;
  color: rgba(0, 0, 0, 0.6);
  position: absolute;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  line-height: 20px;
  font-weight: 400;
  letter-spacing: 0.00937em;
  transform-origin: left top;
}

.q-input-border {
  border-radius: 4px;
  padding: 0 0.5rem 0.25rem 0.5rem;
  position: relative;
}

.body--dark .q-input-text {
  color: rgba(255, 255, 255, 0.7);
}

.body--dark .q-input-border {
  border-color: rgba(255, 255, 255, 0.6);
}

.option-group {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  padding-right: 0.3rem;
}

.option-text {
  max-height: 20px;
  opacity: 1;
}

.q-input-border:hover .option-group,
.q-input-border:focus-within .option-group {
  max-height: 500px;
  opacity: 1;
}

.q-input-border:hover .option-text,
.q-input-border:focus-within .option-text {
  max-height: 0;
  visibility: hidden;
}
</style>
