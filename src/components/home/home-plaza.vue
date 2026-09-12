<template>
    <div class="plaza-grid">
        <HomePlazaTile to="/arena" :icon="arenaIcon" title="烂梗擂台" go="去投票" keep-color>
            <div v-if="arena" class="pk-pair">
                <div class="pk-side">
                    <p class="clamp-text">{{ arena.barrageA }}</p>
                    <div class="pk-meter" :aria-hidden="true">
                        <i :style="{ width: arenaPct.a + '%' }"></i>
                    </div>
                    <span class="pk-pct">{{ arenaPct.a }}%</span>
                </div>
                <span class="pk-vs">VS</span>
                <div class="pk-side">
                    <p class="clamp-text">{{ arena.barrageB }}</p>
                    <div class="pk-meter" :aria-hidden="true">
                        <i :style="{ width: arenaPct.b + '%' }"></i>
                    </div>
                    <span class="pk-pct">{{ arenaPct.b }}%</span>
                </div>
            </div>
            <p v-else class="tile-empty">{{ arenaHint }}</p>
        </HomePlazaTile>

        <HomePlazaTile to="/lifecycle" :icon="lifecycleIcon" title="梗生命周期" go="去看看" keep-color>
            <div v-if="lifecycleReady" class="stages">
                <div v-for="stage in stageCounts" :key="stage.key" class="stage">
                    <span>{{ stage.icon }}</span>
                    <b class="stage-count">{{ stage.cnt }}</b>
                    <span class="stage-name">{{ stage.name }}</span>
                </div>
            </div>
            <p v-else class="tile-empty">{{ lifecycleHint }}</p>
        </HomePlazaTile>

        <HomePlazaTile to="/stale" :icon="staleIcon" title="烂度热榜" go="去打分" keep-color>
            <template v-if="staleTop">
                <p class="clamp-text">{{ staleTop.barrage }}</p>
                <div class="thermo">
                    <div class="thermo-track">
                        <div class="thermo-fill" :class="staleThermoClass(staleTop.staleScore)" :style="{ width: clampedScore(staleTop.staleScore) + '%' }"></div>
                    </div>
                    <span class="thermo-label">{{ Math.round(staleTop.staleScore) }}°</span>
                </div>
            </template>
            <p v-else class="tile-empty">{{ staleHint }}</p>
        </HomePlazaTile>

        <HomePlazaTile to="/image" :icon="imageIcon" title="时光相册" go="去逛逛">
            <div v-if="albumImage" class="album-body">
                <img class="album-thumb" :src="albumImage.url" :alt="albumTitle" />
                <div>
                    <p class="clamp-text">{{ albumTitle }}</p>
                    <p class="album-hint">玩机器相关照片，也欢迎补一张</p>
                </div>
            </div>
            <p v-else class="tile-empty">{{ albumHint }}</p>
        </HomePlazaTile>
    </div>
</template>

<script setup lang="ts">
import HomePlazaTile from '@/components/home/home-plaza-tile.vue';
import { useHomePlaza } from '@/composables/useHomePlaza';
import arenaIcon from '@/assets/icons/arena_icon.svg';
import imageIcon from '@/assets/icons/image_icon.svg';
import lifecycleIcon from '@/assets/icons/lifecycle_icon.svg';
import staleIcon from '@/assets/icons/stale_icon.svg';
import { staleThermoClass } from '@/utils/homePlaza';

const { arena, arenaHint, arenaPct, lifecycleReady, lifecycleHint, stageCounts, staleTop, staleHint, albumImage, albumHint, albumTitle } = useHomePlaza();

function clampedScore(score: number) {
    return Math.min(100, Math.max(0, score));
}
</script>

<style scoped lang="scss">
.plaza-grid {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 8px;
}

.tile-empty {
    margin: auto 0;
    color: var(--body-color);
    font-size: 13px;
    opacity: 0.72;
}

.clamp-text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-height: 1.45;
}

.pk-pair {
    display: flex;
    flex: 1;
    align-items: stretch;
    gap: 8px;
    min-height: 0;
}

.pk-side {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
}

.pk-side .clamp-text {
    flex: 1;
    font-size: 13px;
}

.pk-meter {
    height: 6px;
    overflow: hidden;
    border-radius: 4px;
    background: var(--el-fill-color);
}

.pk-meter i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #ff6b35;
}

.pk-pct {
    color: #e74c3c;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
}

.pk-vs {
    flex-shrink: 0;
    align-self: center;
    color: #e74c3c;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.04em;
    line-height: 1;
}

.stages {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    align-content: center;
}

.stage {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-align: center;
}

.stage-count {
    font-size: 18px;
    line-height: 1.1;
}

.stage-name {
    color: var(--body-color);
    font-size: 11px;
    opacity: 0.72;
}

.thermo {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
}

.thermo-track {
    flex: 1;
    height: 8px;
    overflow: hidden;
    border-radius: 4px;
    background: var(--el-fill-color-light);
}

.thermo-fill {
    height: 100%;
    border-radius: inherit;
}

.thermo-fill.thermo-cool {
    background: linear-gradient(90deg, #3498db, #5dade2);
}

.thermo-fill.thermo-warm {
    background: linear-gradient(90deg, #f39c12, #ffd666);
}

.thermo-fill.thermo-hot {
    background: linear-gradient(90deg, #e67e22, #ff6b35);
}

.thermo-fill.thermo-fire {
    background: linear-gradient(90deg, #e74c3c, #ff6b35, #ffd700);
}

.thermo-label {
    min-width: 2em;
    color: #e74c3c;
    font-size: 13px;
    font-weight: 700;
}

.album-body {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 10px;
    min-height: 0;
}

.album-thumb {
    width: 88px;
    height: 88px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 8px;
    background: var(--el-fill-color-light);
}

.album-hint {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.72;
}

@media (max-width: 600px) {
    .plaza-grid {
        grid-template-columns: 1fr;
    }

    .album-thumb {
        width: 72px;
        height: 72px;
    }
}
</style>
