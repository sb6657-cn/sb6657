import { useMediaQuery } from '@/composables/useMediaQuery';

export function useIsMobile() {
    return useMediaQuery('(max-width: 768px)');
}
