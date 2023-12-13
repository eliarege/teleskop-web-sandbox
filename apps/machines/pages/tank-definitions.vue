<script setup lang="ts">
const selectedMachineId = ref()
const selectedDefinition = ref()
const tankNo = ref()
const tankName = ref()
const highLimit = ref()
const machineConstantHighLimit = ref()

const { data: machines } = useLazyFetch('/api/command-timeout-reasons/command-map-machines')

const { data: tankDefinitions, refresh: refreshDefinitions } = useLazyFetch('/api/tank-definitions/tank-definitions', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

const { data: highLimitOptions } = useLazyFetch('/api/machine-parameters/machine-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameters) => {
    return parameters.map((p) => {
      return {
        label: `${p.paramString} (${p.paramHighLimit})`,
        value: p.paramHighLimit,
      }
    })
  },
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleTankDefinitionClick(tankDef) {
  selectedDefinition.value = tankDef.tankNo
  tankNo.value = tankDef.tankNo
  tankName.value = tankDef.name
  highLimit.value = tankDef.highLimit
  machineConstantHighLimit.value = tankDef.machineConstantHighLimit
}

async function handleTankDefinitionAdd() {
  const tankDef = {
    machineId: selectedMachineId.value,
    tankNo: tankNo.value,
    name: tankName.value,
    highLimit: highLimit.value.value,
    machineConstantHighLimit: machineConstantHighLimit.value,
  }
  await addTankDefinition(tankDef)
  await refreshDefinitions()
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-sm">
      <h3>Kazan Tanımları</h3>
      <q-list bordered separator>
        <q-item
          v-for="def in tankDefinitions"
          :key="def"
          v-ripple
          clickable
          @click="handleTankDefinitionClick(def)"
        >
          <q-item-section>
            {{ def.name }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-3xl flex flex-col">
      <div class="flex flex-col">
        <q-input
          v-model="tankNo"
          label="Kazan no"
          filled
        />
        <q-input
          v-model="tankName"
          label="Kazan Adı"
          filled
        />
        <q-select
          v-model="highLimit"
          :options="highLimitOptions"
          label="Üst Limit Makine Sabiti"
          option-label="label"
          option-value="value"
          filled
        />
        <q-input
          v-model="machineConstantHighLimit"
          filled
          label="Üst Limit"
        />
        <div>
          <q-btn
            label="Ekle"
            no-caps
            @click="handleTankDefinitionAdd"
          />
        </div>
      </div>
      <div class="grid">
        <q-table
          title="Transfer/Dozaj Komutları"
        />
        <q-table title="İstek Komutları" />
        <q-table title="Sirkülasyonlu Dozaj Komutları" />
        <q-table title="Sirkülasyonlu İstek Komutları" />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.grid{
  grid-template-areas: "1 1"
                       "1 1";
  gap: 2em;
  margin-top: 4em;
}
</style>
