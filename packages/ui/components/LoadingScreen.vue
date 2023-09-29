<script setup lang="ts">
defineProps<{ firstMessage: string, secondMessage?: string, image: string }>()
</script>

<template>
  <div class="wrapper">
    <div class="container">
      <div class="container__item">
        <div class="container__item-body">
          <img :src="image">
          <span class="container__item-body__text">{{
            firstMessage
          }}</span>
          <span class="container__item-body__text">{{
            secondMessage
          }}</span>
          <span class="loader" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  width: 100%;
  height: 100vh;
  color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    .container__item {
      border: 1px solid;
      border-radius: 1rem;
      box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
      display: flex;
      justify-content: center;
      align-items: center;

      .container__item-body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .container__item-body__text {
          display: flex;
          text-align: center;
          font-size: 1.5rem;
          line-height: 2rem;
          opacity: 0.7;
        }

        .container__item-body__text:nth-last-child(0) {
          opacity: 0.5;
        }
      }
    }
  }
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
  animation: rotationBack 0.5s linear infinite;
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

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes rotationBack {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(-360deg);
  }
}
@media (min-width: 640px) {
  .container {
    width: 33%;
  }

  .container__item {
    padding: 12.5rem;
  }
}

@media (min-width: 768px) {
  .container {
    width: 50%;
  }

  .container__item {
    padding: 8.75rem;
  }
}
</style>
