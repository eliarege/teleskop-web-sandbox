<script lang="ts" setup>
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'

const emit = defineEmits<{
  change: [input: string]
  keyPress: [button: string]
}>()
const id = useId()
const keyboard = ref<Keyboard | null>(null)

onMounted(() => {
  keyboard.value = new Keyboard(id, {
    onChange: input => onChange(input),
    onKeyPress: button => onKeyPress(button),
  })
})

function onChange(input: string) {
  emit('change', input)
}

function onKeyPress(button: string) {
  emit('keyPress', button)
  if (button === '{shift}' || button === '{lock}') {
    handleShift()
  }
}

function handleShift() {
  if (keyboard.value) {
    const currentLayout = keyboard.value.options.layoutName
    const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'

    keyboard.value.setOptions({
      layoutName: shiftToggle,
    })
  }
}
</script>

<template>
  <div :id class="virtual-keyboard" />
</template>

<style lang="postcss">
.virtual-keyboard {
  max-width: 850px;

  .keyboard-input {
    width: 850px;
    height: 100px;
    padding: 20px;
    font-size: 20px;
    border: none;
    box-sizing: border-box;
  }

  div.hg-button.hg-standardBtn {
    background-color: white;
  }
  div.hg-button.hg-functionBtn {
    background-color: grey;
  }
}
</style>
