<template>
    <div>
        <HeaderBar :class="{ 'layout-header--sticky': !isMobile }" />
        <MobileTopTabs v-if="isMobile" />

        <div class="main-content">
            <DesktopSidebar v-if="!isMobile" />
            <div class="content" :class="{ 'content--with-home-sidebar': isHomeRoute && !isMobile }">
                <router-view />
            </div>
        </div>
        <GlobalDialogHost />
        <FooterBar></FooterBar>
    </div>
    <RouterLink to="/update">
        <span class="version site-version">{{ sbVersion }}</span>
    </RouterLink>
    <FloatingSidebar :is-home-route="isHomeRoute" />
    <div class="GuiBin">当前直播间贵宾数:{{ OniValue }}</div>
</template>

<script setup lang="ts">
import HeaderBar from '@/views/MainLayout/components/header-bar/header-bar.vue';
import FooterBar from '@/views/MainLayout/components/footer-bar.vue';
import GlobalDialogHost from '@/components/global-dialog-host.vue';
import MobileTopTabs from '@/components/mobile-top-tabs.vue';
import DesktopSidebar from '@/components/desktop-sidebar.vue';
import FloatingSidebar from '@/views/MainLayout/components/right-sidebar/FloatingSidebar.vue';
import { useRoute } from 'vue-router';
import { sbVersion } from '@/apis/httpInstance';
import { useGuiBinStore } from '@/stores/GuiBinStore';
import DouyuWebSocket from '@/utils/douyuWebSocket';
import { computed, onMounted, ref } from 'vue';
import { handleDanmu } from '@/utils/douyuWebSocket';
import { useMemeTagsStore } from '@/stores/memeTags';
import { RouterLink } from 'vue-router';
import { useIsMobile } from '@/composables/useIsMobile';

const route = useRoute();
const isMobile = useIsMobile();
const isHomeRoute = computed(() => route.path === '/' || route.path === '/home');

const guiBinStore = useGuiBinStore();
const memeTagsStore = useMemeTagsStore();
memeTagsStore.setMemeTags();

const OniValue = computed(() => guiBinStore.Oni);

const socket = ref();
onMounted(() => {
    /**
     * ================================================================
     * 首屏加载完之后去除loading页
     */
    const loadingDOM = document.querySelector('#global-loading');
    if (loadingDOM) {
        loadingDOM.classList.add('fade-out');
        setTimeout(() => loadingDOM.remove(), 500);
    }
    /**
     * ================================================================
     */

    socket.value = new DouyuWebSocket(6979222, handleDanmu);
});
</script>

<style lang="scss" scoped>
@media (min-width: 601px) {
    .layout-header--sticky {
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    .main-content {
        display: flex;
        margin-bottom: 40px;
    }

    .content {
        flex: 1;
        width: 0;
        padding: 10px;
    }

    .content--with-home-sidebar {
        padding-right: 360px;
    }

    .version {
        color: black;
        position: fixed;
        right: 10px;
        bottom: 5px;
        z-index: 1002;
        font-size: 10px;

        html.dark & {
            color: var(--el-text-color-secondary);
        }
    }

    :global(.el-backtop) {
        z-index: 1001;
    }

    .GuiBin {
        font-size: 11px;
        position: fixed;
        bottom: 0;
        left: 0px;
        z-index: -1;
    }
}

@media (max-width: 600px) {
    .main-content,
    .content {
        width: 100%;
        max-width: 100%;
        min-width: 0;
    }
    .content {
        // background-color: var(--content-bg);
    }
    .version {
        color: black;
        position: fixed;
        right: 20px;
        bottom: 0px;
        z-index: 1002;
        font-size: 0.5rem;

        html.dark & {
            color: var(--el-text-color-secondary);
        }
    }

    :global(.el-backtop) {
        z-index: 1001;
    }

    .GuiBin {
        font-size: 0.5rem;
        position: fixed;
        bottom: 0;
        left: 0px;
        z-index: 100;
    }
}
</style>
