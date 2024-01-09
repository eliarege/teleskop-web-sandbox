<script lang="ts" setup>
import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";

const props = defineProps(["keyboardClass", "input"])
const keyboardClass = ref(props.keyboardClass || "simple-keyboard")
const keyboard = ref<Keyboard | null>(null)
const emit = defineEmits(['onChange', 'onKeyPress'])
onMounted(() => {
  keyboard.value = new Keyboard(keyboardClass.value, {
    onChange: input => onChange(input),
    onKeyPress: button => onKeyPress(button)
  })
})

watch(() => props.input, (newValue) => {
  if (keyboard.value) {
    keyboard.value.setInput(newValue);
  }
})

function onChange(input: string) {
  emit('onChange', input)
}

function onKeyPress(button: string) {
  emit('onKeyPress', button);
  if (button === "{shift}" || button === "{lock}") {
    handleShift();
  }
}

function handleShift() {
  if (keyboard.value) {
    const currentLayout = keyboard.value.options.layoutName;
    const shiftToggle = currentLayout === "default" ? "shift" : "default";

    keyboard.value.setOptions({
      layoutName: shiftToggle
    })
  }
}
</script>

<template>
  <div :class="keyboardClass"/>
</template>

<style>
  .keyboard-input {
    width: 850px;
    height: 100px;
    padding: 20px;
    font-size: 20px;
    border: none;
    box-sizing: border-box;
  }

  .simple-keyboard {
    max-width: 850px;
  }
  div.hg-button.hg-standardBtn {
    background-color: white;
  }
  div.hg-button.hg-functionBtn {
    background-color: grey;
  }
</style>
