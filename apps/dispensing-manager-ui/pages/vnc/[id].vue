<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const { data: dispenser } = await useFetch(`/api/settings/dispenser/${Number.parseInt(route.params.id as string)}`)
console.log(dispenser.value)
</script>

<template>
  <DispenserVnc
    :id="dispenser.dispNo"
    :name="dispenser.name"
    :websockify-url="config.public.websockifyUrl"
  />
</template>
