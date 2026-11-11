import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { getHotMeme24h, getHotMeme7d } from '@/apis/getMeme';

type Period = '24h' | '7d';

export const useHotMemeStore = defineStore('hotMeme', () => {
    const visible = ref(false);
    const period = ref<Period>('24h');
    const rankings = reactive<Record<Period, Meme[]>>({ '24h': [], '7d': [] });
    const loading = reactive({ '24h': false, '7d': false });
    const failed = reactive({ '24h': false, '7d': false });

    async function refresh(target: Period) {
        if (loading[target]) return;
        loading[target] = true;
        failed[target] = false;
        try {
            const items = await (target === '24h' ? getHotMeme24h() : getHotMeme7d());
            if (items) rankings[target] = items;
            else failed[target] = true;
        } finally {
            loading[target] = false;
        }
    }

    function open(target: Period = '24h') {
        period.value = target;
        visible.value = true;
        void refresh(target);
    }

    return { visible, period, rankings, loading, failed, refresh, open };
});
