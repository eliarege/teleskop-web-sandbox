<script setup lang="ts">
export interface IContextMenuOption {
  label: string
  category: string
  icon: string
  disabled: boolean
  onClick: (data: any) => void
}

const props = defineProps<{
  contextMenuOptions: Partial<IContextMenuOption>[]
  target: string | boolean | Element
}>()

const emit = defineEmits(['click'])

function handleClick(event: Event, option: Partial<IContextMenuOption>) {
  if (option.disabled)
    event.preventDefault()
  else {
    emit('click', option)
  }
}
</script>

<template>
  <q-menu
    touch-position
    context-menu
    class="whitespace-nowrap"
    :target
  >
    <q-list>
      <template
        v-for="option in props.contextMenuOptions"
        :key="option.category"
      >
        <q-item
          v-close-popup="!option.disabled"
          clickable
          dense
          :class="option.disabled ? 'text-gray cursor-not-allowed' : ''"
          @click="event => handleClick(event, option)"
        >
          <q-item-section>
            <div class="flex items-center justify-start gap-3">
              <q-icon dense :name="option.icon" />
              {{ option.label }}
            </div>
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
</template>
