<script setup lang="ts">
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
.q-field--filled .q-field__control {
  border-radius: 4px 4px 0 0;
  background-color: rgba(0, 0, 0, 0.2);
}

.q-radio__inner--truthy {
  color: #000000;
}
.q-checkbox__inner--truthy,
.q-checkbox__inner--indet {
  color: #000000;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

::-webkit-scrollbar {
  width: 0.55rem;
  height: 0.55rem;
  background-color: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #000000;
}
</style>
