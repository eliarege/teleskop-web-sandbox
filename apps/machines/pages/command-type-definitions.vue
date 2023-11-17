<script setup lang="ts">
import { getMachineCommands, getTimeoutReasons } from '~/utils'

const { data: machines } = await useFetch('/api/command-timeout-reasons/command-map-machines')

const selectedMachineId = ref()
const machineCommands = ref()
const timeoutReasons = ref()

async function handleMachineClick(machineId: number) {
  machineCommands.value = await getMachineCommands(machineId)
  selectedMachineId.value = machineId
}

async function handleCommandClick(commandNo: number) {
  const selectedTimeoutReasons = await getSelectedTimeoutReasons(selectedMachineId.value, commandNo)
  const allTimeoutReasons = await getTimeoutReasons()
  timeoutReasons.value = allTimeoutReasons.map(r => ({
    ...r,
    checked: selectedTimeoutReasons.some(selectedReason => selectedReason.id === r.id),
  }))
}
</script>

<template>
  <q-card class="flex flex-row">
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
      <h3>Seçili Makine Komutları</h3>
      <q-list bordered separator>
        <q-item
          v-for="command in machineCommands"
          :key="command.commandNo"
          v-ripple
          clickable
          @click="handleCommandClick(command.commandNo)"
        >
          <q-item-section>
            {{ command.commandName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="grid">
      <div class="w-sm box">
        <h3>Kimyasal Kazanı Transfer Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Kimyasal İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Boya Kazanı Transfer Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Boya İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>pH Kontrol</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Rezerve Kazanı Transfer Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Tuz İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Manuel Ölçüm Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Manuel Kimyasal İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Manuel Boya İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Jenerik Materyal 1 İstek</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Jenerik Materyal 2 İstek</h3>
        <q-list bordered separator>
          <q-item
            v-for="reason in timeoutReasons"
            :key="reason.id"
            v-ripple
            clickable
          >
            <q-checkbox v-model:model-value="reason.checked" />
            <q-item-section>
              {{ reason.reasonText }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.box {
  max-width: 20em;
  max-height: 20em;
  overflow-y: scroll;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
</style>
