<template>
    <div class="home-right-dock">
        <HomeCheckinStrip />
    </div>
</template>

<script setup lang="ts">
import HomeCheckinStrip from '@/components/home/home-checkin-strip.vue';
</script>

<style scoped lang="scss">
.home-right-dock {
    position: fixed;
    top: 30%;
    right: 10px;
    z-index: 5;
    width: 300px;
}
</style>
