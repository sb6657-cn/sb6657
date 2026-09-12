<template>
    <div class="floating-sidebar">
        <HomeRightDock v-if="showHomeWordCloud" />
        <HomeWordCloudPanel v-if="showHomeWordCloud" class="home-right-word-cloud" />

        <div class="draggable chat-room-draggable" :style="{ left: `${chatX}vw`, top: `${chatY}px` }" @mousedown="startDrag" v-show="isChatVisible">
            <ChatRoom />
            <el-button class="close-button" @click="closeChat" type="primary">
                <svg t="1725098483582" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4538" width="16" height="16">
                    <path d="M0 0h1024v1024H0z" fill="#ff0505" fill-opacity="0" p-id="4539"></path>
                    <path
                        d="M240.448 168l2.346667 2.154667 289.92 289.941333 279.253333-279.253333a42.666667 42.666667 0 0 1 62.506667 58.026666l-2.133334 2.346667-279.296 279.210667 279.274667 279.253333a42.666667 42.666667 0 0 1-58.005333 62.528l-2.346667-2.176-279.253333-279.253333-289.92 289.962666a42.666667 42.666667 0 0 1-62.506667-58.005333l2.154667-2.346667 289.941333-289.962666-289.92-289.92a42.666667 42.666667 0 0 1 57.984-62.506667z"
                        fill="#ff0505"
                        p-id="4540"></path>
                </svg>
            </el-button>
        </div>

        <el-popover placement="left" title="" :width="300" trigger="hover" :visible="qqGroupHintVisible" content="官方交流群🐧:1070269456、526042235">
            <template #reference>
                <el-button class="official-group-button" plain @mouseenter="qqGroupHintVisible = true" @mouseleave="qqGroupHintVisible = false" @click="qqGroupDialogVisible = true">
                    官方交流群🐧
                </el-button>
            </template>
        </el-popover>

        <!-- <el-popover placement="left" title="" :width="300" trigger="hover" :visible="sponsorHintVisible"
        content="为了甲方爸爸继续支持我们，各位爹注册一下吧🙏，凑凑人头吧，祝你们长生不老永远不死。🙇">
        <template #reference>
            <el-button class="sponsor-button" plain @mouseenter="sponsorHintVisible = true"
                @mouseleave="sponsorHintVisible = false" @click="adImageDialogVisible = true">金主要求注册150人</el-button>
        </template>
    </el-popover>

    <el-dialog v-model="adImageDialogVisible" :draggable="true" title="甲方要求150人注册。ありがとう米娜桑" width="410px">
        <a href="https://yousheng186.com/activity/login/1?promotionCode=6657" target="_blank">
            <img src="https://pic1.imgdb.cn/item/6a25768ed71dee7c941a8d6c.jpg" alt="广告图片"
                style="width: 100%; cursor: pointer" />
        </a>
        <p style="text-align: center; margin-top: 10px; color: #666">感谢甲方爸爸继续支持我们，各位爹注册一下吧🙏，凑凑人头吧，祝你们长生不老永远不死。🙇</p>
    </el-dialog> -->

        <el-dialog v-model="qqGroupDialogVisible" :draggable="true" title="官方交流🐧" width="410px">
            <img src="https://static.wishao.site/sb6657/img/qqgroup.webp" alt="" style="width: 385px" />
        </el-dialog>

        <!-- <div v-if="layoutAdVisible" class="layout-ad">
        <el-popover :visible="popoverVisible" placement="top" title="甲方要求150人注册。ありがとう米娜桑" :width="310">
            <template #reference>
                <div class="layout-ad-content">
                    <a :href="adLink" target="_blank">
                        <img :style="adImageStyle" :src="adImage" alt="" />
                    </a>
                    <el-button class="ad-close-button" :icon="Close" circle size="small"
                        @click.stop.prevent="closeLayoutAd" />
                </div>
            </template>
            <div class="popover-content">
                <p>
                    为了甲方爸爸继续支持我们，各位爹注册一下吧🙏，凑凑人头吧，祝你们长生不老永远不死。🙇
                    <el-button type="primary" size="small" @click="popoverVisible = false">关闭</el-button>
                </p>
            </div>
        </el-popover>
        </div> -->
    </div>
</template>

<script setup lang="ts">
import ChatRoom from '@/components/ChatRoom.vue';
import { useIsMobile } from '@/composables/useIsMobile';
import { Close } from '@element-plus/icons-vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import HomeRightDock from './HomeRightDock.vue';
import HomeWordCloudPanel from './HomeWordCloudPanel.vue';

const props = defineProps<{
    isHomeRoute: boolean;
}>();

const chatX = ref(85);
const chatY = ref(110);
const isChatVisible = ref(true);
const isDragging = ref(false);
const qqGroupDialogVisible = ref(false);
const adImageDialogVisible = ref(false);
const qqGroupHintVisible = ref(true);
const sponsorHintVisible = ref(true);
const isMobile = useIsMobile();
const popoverVisible = ref(true);
const layoutAdVisible = ref(true);
const layoutAdClosed = ref(false);
const responsiveReady = ref(false);
let hintTimer: ReturnType<typeof setTimeout> | null = null;
let removeDragListeners: (() => void) | null = null;

const isHomeRoute = computed(() => props.isHomeRoute);
const showHomeWordCloud = computed(() => responsiveReady.value && isHomeRoute.value && !isMobile.value);
const adLink = 'https://yousheng186.com/activity/login/1?promotionCode=6657';

const adImage = computed(() => {
    return isHomeRoute.value ? 'https://pic1.imgdb.cn/item/6a25768ed71dee7c941a8d6c.jpg' : 'https://pic1.imgdb.cn/item/6a05712a57da1d412e138abe.png';
});

const adImageStyle = computed(() => {
    return isHomeRoute.value ? 'width: 350px; height: auto;' : 'width: 220px; height: auto;';
});

watch(
    isMobile,
    (newVal) => {
        if (newVal) {
            popoverVisible.value = false;
            layoutAdVisible.value = false;
            return;
        }

        if (!layoutAdClosed.value) {
            layoutAdVisible.value = true;
        }
    },
    { immediate: true }
);

const startDrag = (event: MouseEvent) => {
    event.preventDefault();
    removeDragListeners?.();

    const initialMouseX = event.clientX;
    const initialMouseY = event.clientY;
    const initialX = chatX.value;
    const initialY = chatY.value;
    isDragging.value = true;

    const dragging = (moveEvent: MouseEvent) => {
        if (!isDragging.value) {
            return;
        }

        const deltaX = moveEvent.clientX - initialMouseX;
        const deltaY = moveEvent.clientY - initialMouseY;
        chatX.value = initialX + deltaX / 19.2;
        chatY.value = initialY + deltaY;
    };

    const stopDrag = () => {
        isDragging.value = false;
        removeDragListeners?.();
        removeDragListeners = null;
    };

    document.addEventListener('mousemove', dragging);
    document.addEventListener('mouseup', stopDrag);
    removeDragListeners = () => {
        document.removeEventListener('mousemove', dragging);
        document.removeEventListener('mouseup', stopDrag);
    };
};

const closeChat = () => {
    isChatVisible.value = false;
};

const closeLayoutAd = () => {
    layoutAdClosed.value = true;
    layoutAdVisible.value = false;
    popoverVisible.value = false;
};

onMounted(() => {
    responsiveReady.value = true;
    hintTimer = setTimeout(() => {
        qqGroupHintVisible.value = false;
        sponsorHintVisible.value = false;
    }, 1000);
});

onBeforeUnmount(() => {
    if (hintTimer) {
        clearTimeout(hintTimer);
    }
    removeDragListeners?.();
});
</script>

<style scoped lang="scss">
.floating-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    overflow: visible;
    z-index: 100;
}

.home-right-word-cloud {
    z-index: 5;
    position: fixed;
    bottom: 100px;
    right: 10px;
}

.close-button:hover {
    color: var(--body-color);
}

.close-button {
    position: absolute;
    top: 5px;
    right: 5px;
    background: transparent;
    width: 30px;
    height: 25px;
}

.draggable {
    box-shadow: 0px 7px 30px 0px rgba(100, 100, 111, 0.3);
    background-color: var(--card-bg);
    border-radius: 10px;
    margin-top: -50px;
    width: 250px;
    right: 30px;
    position: fixed;
    cursor: Move;
    z-index: 100;
}

.official-group-button {
    position: fixed;
    top: 55%;
    right: 0;
    writing-mode: vertical-rl;
    text-orientation: upright;
    white-space: nowrap;
    height: 100px;
    width: 30px;
    z-index: 1000;
}

.sponsor-button {
    position: fixed;
    top: 75%;
    right: 0;
    writing-mode: vertical-rl;
    text-orientation: upright;
    white-space: nowrap;
    height: 150px;
    width: 30px;
    z-index: 1000;
}

.layout-ad {
    position: fixed;
    top: 30%;
    right: 0px;
    z-index: 999;

    .popover-content {
        text-align: center;

        p {
            margin-bottom: 15px;
            font-size: 14px;
            color: var(--body-color);
        }
    }
}

.layout-ad-content {
    position: relative;
}

.ad-close-button {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
}

@media (max-width: 600px) {
    .home-right-word-cloud {
        display: none;
    }

    .draggable {
        margin-top: 50px;
    }

    .close-button {
        display: none;
    }

    .chat-room-draggable {
        display: none;
    }

    .official-group-button {
        position: fixed;
        top: 55%;
        right: 0;
        writing-mode: vertical-rl;
        text-orientation: upright;
        white-space: nowrap;
        height: 100px;
        width: 13px;
        font-size: 11px;
        z-index: 1000;
        padding: 8px 10px;
    }

    .sponsor-button {
        position: fixed;
        top: 85%;
        right: 0;
        writing-mode: vertical-rl;
        text-orientation: upright;
        white-space: nowrap;
        height: 120px;
        width: 13px;
        font-size: 11px;
        z-index: 1000;
        padding: 8px 10px;
    }

    .layout-ad {
        display: none;
    }
}
</style>
