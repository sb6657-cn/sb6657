import { API } from '@/constants/backend';
import { get } from '@/apis/httpInstance';
import type { AlbumPage } from '@/types/timeAlbum';
import { arenaPercents, LIFECYCLE_STAGES, pickRunningOrFirst } from '@/utils/homePlaza';
import { getAlbumImageTitle } from '@/utils/timeAlbum';
import { computed, onMounted, ref } from 'vue';

interface ArenaMatch {
    barrageA: string;
    barrageB: string;
    voteA: number;
    voteB: number;
    status: string;
}

interface StageStat {
    stage: string;
    cnt: number;
}

interface StaleMeme {
    barrage: string;
    staleScore: number;
}

export function useHomePlaza() {
    const arena = ref<ArenaMatch | null>(null);
    const arenaHint = ref('加载中…');
    const stages = ref<StageStat[]>([]);
    const lifecycleReady = ref(false);
    const lifecycleHint = ref('加载中…');
    const staleTop = ref<StaleMeme | null>(null);
    const staleHint = ref('加载中…');
    const albumImage = ref<{ url: string; date?: string } | null>(null);
    const albumHint = ref('加载中…');

    const arenaPct = computed(() => (arena.value ? arenaPercents(arena.value.voteA, arena.value.voteB) : { a: 50, b: 50 }));
    const stageCounts = computed(() =>
        LIFECYCLE_STAGES.map((stage) => ({
            ...stage,
            cnt: stages.value.find((item) => item.stage === stage.key)?.cnt ?? 0,
        })),
    );
    const albumTitle = computed(() => (albumImage.value ? getAlbumImageTitle(albumImage.value) : ''));

    async function loadArena() {
        const res = await get<{ matches?: ArenaMatch[] }>(API.ARENA_CURRENT);
        if (res._failure || !res.flatData) {
            arenaHint.value = '暂时没拉到，点进擂台看看';
            return;
        }
        arena.value = pickRunningOrFirst(res.flatData.matches ?? []);
        if (!arena.value) {
            arenaHint.value = '今天还没有 PK，零点后生成';
        }
    }

    async function loadLifecycle() {
        const res = await get<{ stages?: StageStat[] }>(API.LIFECYCLE_DASHBOARD);
        if (res._failure || !res.flatData) {
            lifecycleHint.value = '暂时没拉到，点进看板看看';
            return;
        }
        stages.value = res.flatData.stages ?? [];
        lifecycleReady.value = true;
    }

    async function loadStale() {
        const res = await get<{ list?: StaleMeme[] }>(`${API.STALE_RANK}?pageNum=1&pageSize=1`);
        if (res._failure || !res.flatData?.list?.length) {
            staleHint.value = '暂时没拉到，点进热榜看看';
            return;
        }
        staleTop.value = res.flatData.list[0];
    }

    async function loadAlbum() {
        const res = await get<AlbumPage>('/machine/showImage?pageNum=1&pageSize=1');
        const first = res.flatData?.list?.[0];
        if (res._failure || !first?.url) {
            albumHint.value = '暂时没拉到，点进相册看看';
            return;
        }
        albumImage.value = first;
    }

    onMounted(() => {
        void Promise.all([loadArena(), loadLifecycle(), loadStale(), loadAlbum()]);
    });

    return {
        arena,
        arenaHint,
        arenaPct,
        lifecycleReady,
        lifecycleHint,
        stageCounts,
        staleTop,
        staleHint,
        albumImage,
        albumHint,
        albumTitle,
    };
}
