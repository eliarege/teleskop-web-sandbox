<script setup lang="ts">
defineEmits(['close'])
</script>

<template>
  <div class="modal-mask cursor-pointer" @click.stop="$emit('close')">
    <div class="modal-wrapper cursor-pointer">
      <div class="modal-container cursor-pointer w-full relative">
        <div class="relative w-auto" @click.stop.prevent>
          <slot name="default" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.modal-mask {
  background-color: rgba(0, 0, 0, 0.5);
  @apply fixed top-0 left-0 w-full h-100vh flex z-2001 justify-center items-center self-center m-auto select-none overflow-hidden;
  .modal-wrapper {
    @apply flex justify-center h-100vh w-full;
    .modal-container {
      @apply h-auto m-auto flex justify-center items-center w-full;
    }
  }
}
</style>
