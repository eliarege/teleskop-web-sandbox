<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { QBtn, QIcon, QItem, QItemSection, QList, QMenu, QTooltip, debounce } from 'quasar'
import { useResizeObserver } from '@vueuse/core'
import type { CustomQBtnProps } from '../composables/useContextBar'

export interface CollapsibleButton {
  label?: string | number
  icon?: string
  tooltip?: string
  shortcut?: string
  disable?: boolean
  visible?: boolean
  onClick?: () => void
}

const props = withDefaults(defineProps<{
  buttons: readonly CustomQBtnProps[]
  menuIcon?: string
  menuTooltip?: string
  dense?: boolean
}>(), {
  menuIcon: 'more_vert',
  menuTooltip: 'Menu',
  dense: false,
})

const BUTTON_MIN_WIDTH = 50 // icon-only width

const container = ref<HTMLElement | null>(null)
const buttonsContainer = ref<HTMLElement | null>(null)

// Butonların AÇIK halinin genişliklerini sakla
const buttonsOpenWidth = ref<number[]>([])

const showLabels = ref<boolean[]>([])
const showAsMenu = ref(false)

const visibleButtons = computed(() =>
  props.buttons.filter(btn => btn.visible !== false),
)

// İlk yüklenmede butonların açık genişliklerini ölç
onMounted(async () => {
  await nextTick()
  showLabels.value = visibleButtons.value.map(() => true)
  await nextTick()
  if (buttonsContainer.value) {
    buttonsOpenWidth.value = Array.from(buttonsContainer.value.children).map(
      btn => (btn as HTMLElement).offsetWidth,
    )
  }
})

useResizeObserver(container, debounce(() => {
  if (!container.value || buttonsOpenWidth.value.length === 0)
    return

  const containerWidth = container.value.offsetWidth
  const buttonCount = visibleButtons.value.length

  // Minimum genişlik: tüm butonlar sadece ikon halinde
  const minWidthAllIcons = buttonCount * BUTTON_MIN_WIDTH

  // Eğer tüm ikonlar bile sığmıyorsa → hamburger menü
  if (containerWidth < minWidthAllIcons) {
    showAsMenu.value = true
    return
  }

  // Menü modundan çıkış
  if (showAsMenu.value) {
    showAsMenu.value = false
    return
  }

  if (!buttonsContainer.value)
    return

  // Mevcut genişlikleri ölç
  const currentWidths = Array.from(buttonsContainer.value.children).map(
    btn => (btn as HTMLElement).offsetWidth,
  )

  let totalWidth = currentWidths.reduce((sum, w) => sum + w, 0)

  // Buton etiketlerini gizle (sondan başa)
  for (let i = currentWidths.length - 1; i >= 0; i--) {
    if (totalWidth <= containerWidth)
      break

    if (showLabels.value[i]) {
      const diff = buttonsOpenWidth.value[i] - BUTTON_MIN_WIDTH
      totalWidth -= diff
      showLabels.value[i] = false
    }
  }

  // Buton etiketlerini göster (baştan sona)
  for (let i = 0; i < currentWidths.length; i++) {
    if (showLabels.value[i])
      continue

    const widthToAdd = buttonsOpenWidth.value[i] - BUTTON_MIN_WIDTH

    if (totalWidth + widthToAdd > containerWidth)
      break

    totalWidth += widthToAdd
    showLabels.value[i] = true
  }
}, 100))
</script>

<template>
  <div
    ref="container"
    class="collapsible-button-bar flex flex-1 items-center overflow-hidden"
  >
    <!-- Hamburger Menu Mode -->
    <template v-if="showAsMenu">
      <QBtn
        :icon="menuIcon"
        :dense="dense"
        flat
        square
      >
        <QTooltip>{{ menuTooltip }}</QTooltip>
        <QMenu>
          <QList :dense="dense">
            <QItem
              v-for="button in visibleButtons"
              :key="button.label"
              v-close-popup
              clickable
              :dense="dense"
              :disable="button.disable"
              @click="button.onClick"
            >
              <QItemSection
                v-if="button.icon"
                class="min-w-[32px]"
                avatar
              >
                <QIcon
                  :name="button.icon"
                  size="18px"
                />
              </QItemSection>
              <QItemSection>{{ button.label }}</QItemSection>
              <QItemSection
                v-if="button.shortcut"
                side
              >
                <span class="text-gray-5 text-xs">{{ button.shortcut }}</span>
              </QItemSection>
            </QItem>
          </QList>
        </QMenu>
      </QBtn>
    </template>

    <!-- Buttons Mode -->
    <template v-else>
      <div
        ref="buttonsContainer"
        class="flex items-center whitespace-nowrap"
      >
        <QBtn
          v-for="(button, index) in visibleButtons"
          :key="button.label"
          :disable="button.disable"
          :icon="button.icon"
          :label="showLabels[index] ? button.label : undefined"
          square
          flat
          @click="button.onClick"
        >
          <QTooltip v-if="button.tooltip || button.shortcut">
            {{ button.tooltip }}
            <span v-if="button.shortcut">
              ({{ button.shortcut }})
            </span>
          </QTooltip>
        </QBtn>
      </div>
    </template>
  </div>
</template>

<style lang="postcss" scoped>
.collapsible-button-bar {
  :deep(.q-btn) {
    @apply text-transform: capitalize;
    @apply color-gray-7 dark:color-gray-3;
    font-size: 14px !important;
  }

  :deep(.q-btn .q-icon) {
    font-size: 18px !important;
  }
}
</style>
