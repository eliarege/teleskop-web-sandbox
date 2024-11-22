<script setup lang="ts">
const props = defineProps<{ machines: { id: number, name: string }[] }>()

const { t } = useI18n()

const machineSearch = ref('')

const filteredMachines = computed(() => {
  if (machineSearch.value === '') {
    return props.machines
  } else {
    return props.machines.filter(m => m.name.toLowerCase().includes(machineSearch.value.toLowerCase()))
  }
})

const activeMachine = defineModel({ type: Number, required: true })
</script>

<template>
  <div class="w-70 alarm-container-height border-r-1 p-2 select-none">
    <div style="height: 75px">
      <span class="font-extrabold text-xl ml-3">{{ t('alarm.machines') }}</span>
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
    </div>
    <q-list class="machine-container">
      <q-item
        v-for="machine in filteredMachines"
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

<style lang="postcss" scoped>
.alarm-container-height {
  height: calc(100vh - 150px);
  overflow: auto;
}
</style>
