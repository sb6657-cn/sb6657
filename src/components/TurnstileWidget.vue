<template>
  <div class="turnstile-container" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    action?: string;
    modelValue?: string;
    siteKey?: string;
    theme?: 'auto' | 'light' | 'dark';
    size?: 'normal' | 'compact' | 'flexible';
  }>(),
  {
    action: '',
    modelValue: '',
    siteKey: '0x4AAAAAAFA6zZmxj10LIRTM',
    theme: 'auto',
    size: 'normal',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', token: string): void;
  (e: 'success', token: string): void;
  (e: 'expired'): void;
  (e: 'error'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const widgetId = ref<string | null>(null);
const currentToken = ref('');

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          action?: string;
          theme?: string;
          size?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string | null) => void;
      remove: (widgetId?: string | null) => void;
      getResponse: (widgetId?: string | null) => string;
    };
  }
}

function renderWidget() {
  if (!containerRef.value || !window.turnstile || widgetId.value !== null) {
    return;
  }

  try {
    widgetId.value = window.turnstile.render(containerRef.value, {
      sitekey: props.siteKey,
      action: props.action || undefined,
      theme: props.theme,
      size: props.size,
      callback: (token: string) => {
        currentToken.value = token;
        emit('update:modelValue', token);
        emit('success', token);
      },
      'expired-callback': () => {
        currentToken.value = '';
        emit('update:modelValue', '');
        emit('expired');
      },
      'error-callback': () => {
        currentToken.value = '';
        emit('update:modelValue', '');
        emit('error');
      },
    });
  } catch (err) {
    console.error('Turnstile render failed:', err);
  }
}

function reset() {
  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.reset(widgetId.value);
    } catch (e) {
      console.warn('Turnstile reset error:', e);
    }
  }
  currentToken.value = '';
  emit('update:modelValue', '');
}

function getToken() {
  if (widgetId.value !== null && window.turnstile) {
    return window.turnstile.getResponse(widgetId.value) || currentToken.value;
  }
  return currentToken.value;
}

onMounted(() => {
  if (window.turnstile) {
    renderWidget();
  } else {
    const timer = setInterval(() => {
      if (window.turnstile) {
        clearInterval(timer);
        renderWidget();
      }
    }, 100);
    setTimeout(() => clearInterval(timer), 10000);
  }
});

onBeforeUnmount(() => {
  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.remove(widgetId.value);
    } catch (e) {
      console.warn('Turnstile remove error:', e);
    }
    widgetId.value = null;
  }
});

watch(
  () => props.action,
  () => {
    reset();
  }
);

defineExpose({
  reset,
  getToken,
  getWidgetId: () => widgetId.value,
});
</script>

<style scoped>
.turnstile-container {
  min-height: 65px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0;
}
</style>
