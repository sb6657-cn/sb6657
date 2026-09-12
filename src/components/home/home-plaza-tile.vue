<template>
    <RouterLink class="card plaza-tile" :to="to">
        <div class="tile-head">
            <span class="tile-title">
                <img :src="icon" class="tile-icon" :class="{ 'keep-color': keepColor }" alt="" />
                {{ title }}
            </span>
            <span class="tile-go">{{ go }}</span>
        </div>
        <slot />
    </RouterLink>
</template>

<script setup lang="ts">
defineProps<{
    to: string;
    icon: string;
    title: string;
    go: string;
    keepColor?: boolean;
}>();
</script>

<style scoped lang="scss">
.plaza-tile {
    display: flex;
    width: 100%;
    min-height: 148px;
    flex-direction: column;
    gap: 8px;
    color: inherit;
    text-decoration: none;

    &:hover {
        color: inherit;
    }

    &:hover .tile-title,
    &:hover .tile-go {
        color: var(--el-color-primary);
    }
}

.tile-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.tile-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--body-color);
    font-size: 16px;
    font-weight: 600;
    transition: color 0.15s ease;
}

.tile-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
}

.tile-go {
    flex-shrink: 0;
    color: var(--el-color-primary);
    font-size: 13px;
    transition: color 0.15s ease;
}

html.dark .tile-icon:not(.keep-color) {
    filter: invert(1);
}
</style>
