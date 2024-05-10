<script setup lang="ts">
defineProps<{ img: string }>()
defineEmits(['click'])
</script>

<template>
  <button
    class="t7-keyinput"
    :style="{ backgroundImage: `url(${img})` }"
    @click="$emit('click', $event)"
  />
</template>

<style scoped lang="postcss">
.t7-keyinput {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-repeat: no-repeat;

  &:hover {
    filter: brightness(1.2);
  }
  &:active {
    filter: brightness(1.3);
  }
  & img {
    object-fit: scale-down;
    width: 100%;
    height: 100%;
  }
}
</style>
