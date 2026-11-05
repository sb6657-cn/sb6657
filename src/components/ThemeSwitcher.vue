<template>
  <el-dropdown class="theme-dropdown-trigger" @command="handleCommand">
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="opt in options"
          :key="opt.mode"
          :command="opt.mode"
          class="theme-dropdown-item"
        >
          <span class="menu-icon">
            <MorphIcon :icon="opt.icon" :size="16" :stroke-width="2" />
          </span>
          <span>{{ opt.label }}</span>
          <span v-if="theme.mode === opt.mode" class="check-icon">
            <MorphIcon :icon="Check" :size="14" :stroke-width="2.5" />
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
    <div class="theme-dropdown-icon" :class="{ 'mobile-light': isMobile && !theme.isDark }" title="切换主题">
      <MorphIcon :icon="currentIcon" :size="24" :stroke-width="2" spring="snappy" />
    </div>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MorphIcon } from 'morphicons/vue'
import { Sun, Moon, Monitor, Check } from 'lucide'
import type { IconNode } from 'lucide'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'
import { useIsMobile } from '@/composables/useIsMobile'

const theme = useThemeStore()
const isMobile = useIsMobile()

interface Option {
  mode: ThemeMode
  label: string
  icon: IconNode
}

const options: Option[] = [
  { mode: 'system', label: '跟随系统', icon: Monitor },
  { mode: 'light', label: '浅色模式', icon: Sun },
  { mode: 'dark', label: '深色模式', icon: Moon }
]

const currentIcon = computed(() => {
  const opt = options.find(o => o.mode === theme.mode)
  return opt?.icon ?? Monitor
})

function handleCommand(mode: ThemeMode) {
  theme.setMode(mode)
}
</script>

<style scoped lang="scss">
.theme-dropdown-trigger {
  display: inline-flex;
  align-items: center;

  .theme-dropdown-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #fff;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  .mobile-light {
    color: #333;

    &:hover {
      background: rgba(128, 128, 128, 0.15);
    }
  }
}

.theme-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .menu-icon {
    flex-shrink: 0;
    width: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .check-icon {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary, #11A983);
  }
}
</style>
