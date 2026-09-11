import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { resolveIsDark, systemDarkForApply, type ThemeMode } from '@/utils/themeMode';

export type { ThemeMode };

const STORAGE_KEY = 'theme-mode';

function readSystemDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useThemeStore = defineStore('theme', () => {
    const mode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system');
    const systemDark = ref(readSystemDark());

    const isDark = computed(() => resolveIsDark(mode.value, systemDark.value));

    let mediaQuery: MediaQueryList | null = null;
    let mediaListener: ((event: MediaQueryListEvent) => void) | null = null;

    function apply() {
        systemDark.value = systemDarkForApply(mode.value, readSystemDark, systemDark.value);
        document.documentElement.classList.toggle('dark', isDark.value);

        if (mode.value === 'system') {
            if (!mediaQuery) {
                mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaListener = (event: MediaQueryListEvent) => {
                    systemDark.value = event.matches;
                };
                mediaQuery.addEventListener('change', mediaListener);
            }
        } else if (mediaQuery && mediaListener) {
            mediaQuery.removeEventListener('change', mediaListener);
            mediaQuery = null;
            mediaListener = null;
        }
    }

    function setMode(next: ThemeMode) {
        mode.value = next;
        localStorage.setItem(STORAGE_KEY, next);
        apply();
    }

    apply();

    watch(mode, () => {
        apply();
    });

    watch(isDark, (dark) => {
        document.documentElement.classList.toggle('dark', dark);
    });

    return {
        mode,
        isDark,
        setMode,
        apply,
    };
});
