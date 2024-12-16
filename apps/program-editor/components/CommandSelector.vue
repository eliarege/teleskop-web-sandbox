<script setup lang="ts">
import type { QSelect } from 'quasar'
import { isDef } from '@teleskop/utils'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { CommandType } from '~/shared/constants'

const props = defineProps<{
  path: string
}>()

const { t } = useI18n()
const editor = useEditorStore()
const programCommand = ref<ProgramStepCommand>(editor.getPathElement(props.path))
const isMainCommand = props.path.split('.')[2] === 'mainCommand' ? CommandType.MAIN : CommandType.PARALLEL

const select = ref<QSelect>()
const stepIndex = computed(() => Number(props.path.split('.')[1]))
const id = `${editor.program.steps[stepIndex.value].stepId}-${programCommand.value.commandId}`

const filteredCommands = computed(() => {
  const commandsArray: MachineCommand[] = Array.from(editor.machine.commands.values())

  let filteredArray = commandsArray.filter(({ commandType }) => {
    // Ana komut türündeyken paralel komutları filtrele
    return !(isMainCommand === CommandType.MAIN && commandType === CommandType.PARALLEL)
  })

  filteredArray = filteredArray.filter(({ commandNo }) => {
    const step = editor.program.steps[stepIndex.value]

    // Ana komutun "dontUseList" kontrolü
    if (isMainCommand === CommandType.PARALLEL) {
      const mainCommand = step.mainCommand
      const machineMainCommand = editor.machine.commands.get(mainCommand.commandNo)

      // dontUseList'te bulunanları filtrele
      if (machineMainCommand?.dontUseList.includes(commandNo)) {
        return false
      }
    }

    // Aynı komut zaten kullanılmışsa filtrele
    return commandNo === programCommand.value.commandNo
      || (
        step.mainCommand.commandNo !== commandNo
        && !step.parallelCommands.some((command: ProgramStepCommand) => command.commandNo === commandNo)
      )
  })

  return filteredArray.map((command: MachineCommand) => ({
    label: `${command.commandNo} ${command.name}`,
    value: command.commandNo,
  }))
})

const label = computed(() => {
  return !programCommand.value.commandNo ? t('selectCommand') : undefined
})

const rules = [
  (value: number) => {
    return !!value || t('validation.emptyCommand') // Seçim boşsa hata mesajı
  },
  (value: number) => {
    const step = editor.program.steps[stepIndex.value]
    const machineMainCommand = editor.machine.commands.get(step.mainCommand.commandNo)

    // Ana komutun "dontUseList" kontrolü
    if (isMainCommand === CommandType.PARALLEL) {
      if (machineMainCommand?.dontUseList?.includes(value)) {
        return t('cannotParallelCommand', {
          mainCommandNo: step.mainCommand.commandNo,
          parallelCommandNo: value,
        })
      }
    }

    return true
  },
]

watch(() => programCommand.value.commandNo, (commandNo) => {
  if (!commandNo) {
    editor.errorIds.add(id)
    select.value?.focus()
    return
  } else {
    const step = editor.program.steps[stepIndex.value]

    // Ana komutun "dontUseList" kontrolü
    const machineMainCommand = editor.machine.commands.get(step.mainCommand.commandNo)

    if (machineMainCommand?.dontUseList.includes(commandNo)) {
      editor.errorIds.add(id)
      select.value?.focus()
    } else {
      editor.errorIds.delete(id)
    }
  }

  select.value?.validate()
})

watch(() => editor.program.steps[stepIndex.value].mainCommand.commandNo, (commandNo) => {
  if (!programCommand.value.commandNo) {
    editor.errorIds.add(id)
    select.value?.focus()
    return
  }

  const machineMainCommand = editor.machine.commands.get(commandNo)

  // Ana komutun "dontUseList" kontrolü
  if (machineMainCommand?.dontUseList?.includes(programCommand.value.commandNo)) {
    editor.errorIds.add(id)
    select.value?.focus()
  } else {
    editor.errorIds.delete(id)
  }

  select.value?.validate()
})

onMounted(() => {
  console.log('onMounted tetik')
  nextTick(() => {
    const step = editor.program.steps[stepIndex.value]

    // Eğer step.mainCommand veya commandNo tanımlı değilse focus ol
    if (!step?.mainCommand?.commandNo) {
      console.warn('Komut numarası eksik, focus olacak')
      editor.errorIds.add(id)
      select.value?.focus()
      return
    } else {
      const machineMainCommand = editor.machine.commands.get(step.mainCommand.commandNo)

      // Komut "dontUseList" içindeyse hata ekle
      if (machineMainCommand?.dontUseList.includes(programCommand.value.commandNo)) {
        editor.errorIds.add(id)
        select.value?.focus()
      } else {
        editor.errorIds.delete(id)
      }
    }

    select.value?.validate() // QSelect kurallarını tetikle
  })
})
</script>

<template>
  <div>
    <DevOnly>
      <div class="flex flex-col color-gray-5 text-3">
        <span>{{ id }}</span>
      </div>
    </DevOnly>
    <QSelect
      ref="select"
      :model-value="programCommand.commandNo"
      :options="filteredCommands"
      :label="label"
      :rules="rules"
      :for="id"
      option-label="label"
      option-value="value"
      map-options
      hide-bottom-space
      emit-value
      style="width: 250px"
      class="text-3"
      options-dense
      dense
      auto-close
      outlined
      filled
    >
      <template #option="scope">
        <QItem
          v-close-popup
          clickable
          dense
          @click="editor.updateCommand(scope.opt.value, programCommand)"
        >
          <QItemSection class="text-3">
            {{ scope.opt.label }}
          </QItemSection>
        </QItem>
      </template>
      <template #no-option>
        <QItem>
          <QItemSection>
            {{ t('selectCommand') }}
          </QItemSection>
        </QItem>
      </template>
    </QSelect>
  </div>
</template>
