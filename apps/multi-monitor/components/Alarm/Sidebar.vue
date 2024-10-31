<script setup lang="ts">
defineProps<{ machines: { id: number, name: string }[] }>()

function addHash(machineId: number) {
  window.location.hash = machineId.toString()
}
</script>

<template>
  <div class="border-1 border-gray-500/30 rounded max-h-92vh overflow-auto">
    <q-list
      class="rounded-borders"
    >
      <q-item
        v-for="item in machines"
        :key="item.id"
        clickable
        @click="addHash(item.id)"
      >
        <q-item-section>
          {{ item.name }}
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<style scoped lang="postcss">
</style>
