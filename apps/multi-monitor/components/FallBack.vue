<script setup lang="ts">
defineProps<{
  errorMessage: string
  returnMessage: string
}>()
const emit = defineEmits(['return'])
</script>

<template>
  <div class="wrapper">
    <div class="fallback-container">
      <img src="/eliarkurumsal.png">
      <br>
      <span class="font-extrabold text-xl">
        {{ errorMessage }}
      </span>
      <br>
      <q-btn
        outline
        color="primary"
        :label="returnMessage"
        @click="emit('return')"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  height: calc(100vh - 62px);
  @apply flex-center w-full;
}
.fallback-container {
  box-shadow:
    rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
    rgba(0, 0, 0, 0.3) 0px 15px 30px -15px,
    rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
  @apply border-1 border-gray-500/30 rounded flex-center flex-col p-37;
}
</style>
