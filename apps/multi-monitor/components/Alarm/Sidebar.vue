<script setup lang="ts">
const props = defineProps<{ machines: { id: number, name: string }[] }>()

const { t } = useI18n()

const machineSearch = ref('')

const asdsad = computed(() => {
  if (machineSearch.value === '') {
    return props.machines
  } else {
    return props.machines.filter(m => m.name.toLowerCase().includes(machineSearch.value.toLowerCase()))
  }
})

const activeMachine = defineModel({ type: Number, required: true })
</script>

<template>
  <div class="w-70 border-r-1 topbar-height p-2 select-none">
    <span class="font-extrabold text-xl ml-3">{{ t('alarm.machines') }}</span>
    <q-list>
      <q-input
        v-model="machineSearch"
        :label="t('alarm.machineSearch')"
        dense
        flat
        class="px-3"
      >
        <template #append>
          <q-icon
            v-if="machineSearch !== ''"
            name="close"
            class="cursor-pointer"
            @click="machineSearch = ''"
          />
          <q-icon name="search" />
        </template>
      </q-input>

      <q-item
        v-for="machine in asdsad"
        :key="machine.id"
        flat
        dense
        class="rounded-2xl mx-3 my-2"
        clickable
        active-class="bg-blue-300/30"
        :active="activeMachine === machine.id"
        @click="activeMachine = machine.id"
      >
        <q-item-section>{{ machine.name }}</q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<style scoped lang="postcss">
.topbar-height {
  max-height: calc(100vh - 65px);
  overflow: auto;
}
</style>
