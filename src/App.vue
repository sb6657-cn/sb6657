<template>
    <div>
        <RouterView />
        <StarrySky />
        <IdleScreensaver />
        <AnnouncementDialog />
        <MergePigLauncher />
        <MergePigDialog />
        <MergeWatermelonLauncher />
        <MergeWatermelonDialog />
    </div>
</template>

<script setup lang="ts">
import StarrySky from '@/views/Starrysky.vue';
import IdleScreensaver from '@/views/IdleScreensaver.vue';
import AnnouncementDialog from '@/components/AnnouncementDialog.vue';
import MergePigLauncher from '@/components/MergePig/MergePigLauncher.vue';
import MergePigDialog from '@/components/MergePig/MergePigDialog.vue';
import MergeWatermelonLauncher from '@/components/MergeWatermelon/MergeWatermelonLauncher.vue';
import MergeWatermelonDialog from '@/components/MergeWatermelon/MergeWatermelonDialog.vue';
import { useThemeStore } from '@/stores/themeStore';

const theme = useThemeStore();
</script>

<style scoped lang="scss"></style>