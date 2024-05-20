<script setup lang="ts">
import type { CommandIO, CommandIOSelection, ioListItem } from '~/shared/types'

const props = defineProps<{
  path: string
  io: CommandIO
}>()

const editor = useEditorStore()
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
    label: selection.name,
    value: `${selection.type}${separator}${selection.physicalId}`,
  }))
))

function encode(values: ioListItem) {
  return values.value.map(value => value.join(separator))
}
function decode(values: string[]) {
  return values.map(value => value.split(separator).map(v => Number.parseInt(v)) as [number, number])
}
</script>

<template>
  <div class="q-input-border">
    <div class="relative pt-5">
      <div class="q-input-text">
        {{ props.io.name }}
      </div>
      <QOptionGroup
        v-model="model"
        :options="options"
        type="checkbox"
        dense
      />
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
  padding: 0 .5rem .25rem .5rem;
  border: 1px solid rgba(0, 0, 0, 0.24);
}
.body--dark .q-input-text {
  color: rgba(255, 255, 255, 0.7);
}
.body--dark .q-input-border {
  border-color: rgba(255, 255, 255, 0.6);
}
</style>
