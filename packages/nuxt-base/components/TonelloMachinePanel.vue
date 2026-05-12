<script setup lang="ts">
const { width } = useWindowSize()
const maxFactor = 2.5
const deviceWidth = 278
const devicePadding = 8
const factor = computed(() => Math.min(maxFactor, width.value / (deviceWidth + devicePadding)))

</script>

<template>
  <div class="tonello-container" :style="{ '--factor': factor }">
    <div class="tonello-inner-container">
      <div class="tonello-screen-casing">
        <div class="tonello-screen">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.tonello-container {
  --factor: 1.2;
  display: inline-block;
  width: calc(278px * var(--factor));
  min-width: calc(278px * var(--factor));
  height: calc(196px * var(--factor));
  padding: calc(8px * var(--factor)) ;
  border-radius: calc(3px * var(--factor));
  background-color: #adb5bd;
  position: relative;
  box-shadow:
    rgba(0, 0, 0, 0.19) 0px 10px 20px,
    rgba(0, 0, 0, 0.23) 0px 6px 6px;
}

.tonello-inner-container {
  padding: calc(4px * var(--factor)) calc(16px * var(--factor));
  position: relative;
  border-radius: calc(3px * var(--factor));
  background-color: hsl(0, 5%, 24%);
}

.tonello-screen-casing {
  border-radius: calc(2px * var(--factor));
  padding: calc(2px * var(--factor));
  background-color: #adb5bd;
}

.tonello-screen {
  width: 100%;
  aspect-ratio: 4/3;
  position: relative;
  background-color: black;
}
</style>
