<script setup lang="ts">
import '../assets/animations.css'

withDefaults(defineProps<{
  outerColor?: string
  centerColor?: string
  innerColor?: string
  backgroundColor?: string
  withBackground?: boolean
  withWrapper?: boolean
}>(), {
  outerColor: '#212121',
  centerColor: '#0d94fc',
  innerColor: '#212121',
  backgroundColor: '#3c3c3c4d',
  withBackground: false,
  withWrapper: true,
})
</script>

<template>
  <div
    v-if="withWrapper"
    class="spinner-wrapper"
    :style="{ '--outer-color': outerColor, '--center-color': centerColor, '--inner-color': innerColor }"
    :class="{ withBackground: 'spinner-wrapper-background' }"
  >
    <span class="spinner" />
  </div>
  <span
    v-else
    class="spinner"
    :style="{ '--outer-color': outerColor, '--center-color': centerColor, '--inner-color': innerColor }"
  />
</template>

<style scoped lang="postcss">
.spinner-wrapper {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner-wrapper-background {
  background-color: v-bind(backgroundColor);
}

/* Outer spinner */
.spinner {
  border-color: var(--outer-color) var(--outer-color) transparent transparent;
  border-width: 3px;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  width: 48px;
  height: 48px;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
}

.spinner::after,
.spinner::before {
  border-style: solid;
  border-width: 3px;
  border-radius: 50%;
  transform-origin: center center;
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  box-sizing: border-box;
}

/* Center spinner */
.spinner::after {
  border-color: transparent transparent var(--center-color) var(--center-color);
  animation: rotation 0.5s linear reverse infinite;
  width: 40px;
  height: 40px;
}

/* Inner spinner */
.spinner::before {
  border-color: var(--inner-color) var(--inner-color) transparent transparent;
  animation: rotation 1.5s linear infinite;
  width: 32px;
  height: 32px;
}
</style>
