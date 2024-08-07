<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const { data: dispenser } = await useAuthFetch(`/api/settings/dispenser/${Number.parseInt(route.params.id as string)}`)

definePageMeta({
  roles: ['manage'],
})
</script>

<template>
  <DispenserVnc
    :id="dispenser.dispNo"
    :name="dispenser.name"
    :websockify-url="config.public.websockifyUrl"
  />
</template>
