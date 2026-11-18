import { onScopeDispose, ref, type Ref } from 'vue';

export function useMediaQuery(mediaQuery: string): Ref<boolean> {
    const query = window.matchMedia(mediaQuery);
    const matches = ref(query.matches);

    function update(event: MediaQueryListEvent) {
        matches.value = event.matches;
    }

    query.addEventListener('change', update);
    onScopeDispose(() => query.removeEventListener('change', update));
    return matches;
}
