import { ref } from 'vue';

const PASS_KEY = 'cf_turnstile_pass';

export const turnstilePass = ref<string>(localStorage.getItem(PASS_KEY) || '');
export const isGuardVisible = ref<boolean>(false);
export const guardAction = ref<string>('general');

let pendingResolvers: Array<(pass: string) => void> = [];

export function getTurnstilePass(): string {
  if (!turnstilePass.value) {
    turnstilePass.value = localStorage.getItem(PASS_KEY) || '';
  }
  return turnstilePass.value;
}

export function setTurnstilePass(pass: string) {
  turnstilePass.value = pass;
  if (pass) {
    localStorage.setItem(PASS_KEY, pass);
  } else {
    localStorage.removeItem(PASS_KEY);
  }
}

export function triggerTurnstileGuard(action = 'general'): Promise<string> {
  guardAction.value = action;
  isGuardVisible.value = true;
  return new Promise((resolve) => {
    pendingResolvers.push(resolve);
  });
}

export function resolveTurnstileGuard(newPass: string) {
  setTurnstilePass(newPass);
  isGuardVisible.value = false;
  const resolvers = [...pendingResolvers];
  pendingResolvers = [];
  resolvers.forEach((resolve) => resolve(newPass));
}

export function cancelTurnstileGuard() {
  isGuardVisible.value = false;
  pendingResolvers = [];
}
