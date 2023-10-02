<script setup lang="ts">
import '../stylesheets/animations.css'
</script>

<template>
  <div class="wrapper">
    <div class="slot">
      <span class="loader" />
      <slot name="text" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.slot {
  display: flex;
  gap: 0.25rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.wrapper {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10000;
  background-color: rgba(60, 60, 60, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader {
  border-color: #212121 #212121 transparent transparent;
  border-width: 3px;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  width: 48px;
  height: 48px;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
}

.loader::after,
.loader::before {
  border-color: transparent transparent #0d94fc #0d94fc;
  border-style: solid;
  border-width: 3px;
  border-radius: 50%;
  animation: rotation 0.5s reverse infinite;
  transform-origin: center center;
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
}

.loader::before {
  border-color: #212121 #212121 transparent transparent;
  animation: rotation 1.5s linear infinite;
  width: 32px;
  height: 32px;
}

</style>
