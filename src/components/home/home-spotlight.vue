<template>
    <section class="home-spotlight" aria-labelledby="knowledge-title">
        <div class="spotlight-head">
            <h3 id="knowledge-title">{{ currentSpotlight.heading }}</h3>
            <div class="refresh-controls">
                <span class="refresh-text" @click="handleNext">换一条</span>
                <el-icon :class="['refresh-icon', { rotating: isRotating }]" size="18" @click="handleNext">
                    <Refresh />
                </el-icon>
            </div>
        </div>
        <div class="spotlight-viewport">
            <Transition name="spotlight-roll" mode="out-in">
                <div :key="spotlightIndex" class="spotlight-body">
                    <p class="spotlight-q">{{ currentSpotlight.question }}</p>
                    <RouterLink v-if="currentSpotlight.kind === 'route'" class="spotlight-a" :to="currentSpotlight.route">{{ currentSpotlight.answer }}</RouterLink>
                    <nav v-else class="module-links" aria-label="sb6657 历史版本">
                        <a v-for="link in currentSpotlight.links" :key="link.href" :href="link.href" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>
                    </nav>
                </div>
            </Transition>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

const SPOTLIGHTS = [
    {
        kind: 'route' as const,
        heading: '你知道吗？',
        question: '谁目前打出了对位 donk 最多的击杀？谁又是对位 donk 最大的受害者？',
        route: '/15warriorsDonk',
        answer: '布雷德15勇士',
    },
    {
        kind: 'route' as const,
        heading: '你知道吗？',
        question: '一年一度的 sb6657 野榜 TOP20 烂梗在这里。',
        route: '/memeTop20',
        answer: '年度 TOP20 烂梗',
    },
    {
        kind: 'links' as const,
        heading: 'sb6657 时光机',
        question: '万恶之源，我们的来时路。旧版 sb6657.cn 考古专项。',
        links: [
            { href: 'https://sb6657.cn/v1.sb6657.cn/', label: 'sb6657.cn v1' },
            { href: 'https://sb6657.cn/v2.sb6657.cn/', label: 'sb6657.cn v2' },
        ],
    },
];

const spotlightIndex = ref(Math.floor(Math.random() * SPOTLIGHTS.length));
const currentSpotlight = computed(() => SPOTLIGHTS[spotlightIndex.value] ?? SPOTLIGHTS[0]);
const isRotating = ref(false);
let spotlightTimer: ReturnType<typeof setInterval> | undefined;
let rotateTimer: ReturnType<typeof setTimeout> | undefined;

function nextSpotlight() {
    spotlightIndex.value = (spotlightIndex.value + 1) % SPOTLIGHTS.length;
}

function startTimer() {
    spotlightTimer = setInterval(nextSpotlight, 8000);
}

function handleNext() {
    nextSpotlight();
    if (spotlightTimer) {
        clearInterval(spotlightTimer);
        startTimer();
    }
    isRotating.value = true;
    if (rotateTimer) clearTimeout(rotateTimer);
    rotateTimer = setTimeout(() => {
        isRotating.value = false;
    }, 1100);
}

onMounted(() => {
    startTimer();
});
onUnmounted(() => {
    if (spotlightTimer) clearInterval(spotlightTimer);
    if (rotateTimer) clearTimeout(rotateTimer);
});
</script>

<style scoped lang="scss">
.home-spotlight {
    color: var(--body-color);
    font-size: 14px;
    line-height: 1.6;

    h3 {
        margin: 0;
        color: var(--body-color);
        font-size: 18px;
        font-weight: 600;
    }

    a {
        color: #409eff;
        font-weight: 500;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.spotlight-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
}

.refresh-controls {
    display: flex;
    align-items: center;
}

.refresh-text {
    font-size: 18px;
    color: #409eff;
    cursor: pointer;
    text-wrap: nowrap;

    &:hover {
        color: #66b1ff;
    }
}

.refresh-icon {
    color: #409eff;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
        color: #66b1ff;
    }

    &.rotating {
        animation: rotate 0.6s linear;
    }
}

.spotlight-viewport {
    position: relative;
    overflow: hidden;
    height: 5.6em;
}

.spotlight-body {
    position: absolute;
    inset: 0;
}

.spotlight-q {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    margin: 0 0 6px;
}

.spotlight-a {
    font-weight: 600;
}

.module-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 4px;
}

.spotlight-roll-leave-active {
    animation: spotlight-leave 0.48s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.spotlight-roll-enter-active {
    animation: spotlight-enter 0.52s cubic-bezier(0.22, 0.61, 0.36, 1) 0.08s both;
}

@keyframes spotlight-leave {
    from {
        transform: translateY(0);
        opacity: 1;
    }

    to {
        transform: translateY(42%);
        opacity: 0;
    }
}

@keyframes spotlight-enter {
    from {
        transform: translateY(-42%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .spotlight-roll-enter-active,
    .spotlight-roll-leave-active,
    .refresh-icon {
        transition: none;
        animation: none;
    }
}

html.dark a {
    color: var(--el-color-primary);
}
</style>
