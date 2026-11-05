<template>
    <Teleport to="body">
        <Transition name="announcement-fade">
            <div v-if="visible" class="announcement-overlay" @click.self="onClose">
                <div class="announcement-panel">
                    <div class="announcement-header">
                        <span class="announcement-title">{{ currentAnnouncement?.title || '公告' }}</span>
                        <el-button class="header-close" :icon="X" circle text @click="onClose" />
                    </div>

                    <div v-if="currentAnnouncement" class="announcement-content">
                        <el-carousel
                            class="announcement-carousel"
                            height="clamp(200px, 39.375vw, 520px)"
                            :autoplay="false"
                            :loop="false"
                            :arrow="announcements.length > 1 ? 'always' : 'never'"
                            :indicator-position="announcements.length > 1 ? '' : 'none'"
                            @change="handleCarouselChange"
                        >
                            <el-carousel-item v-for="announcement in announcements" :key="announcement.id">
                                <img
                                    v-if="announcement.imgUrl"
                                    :src="announcement.imgUrl"
                                    :alt="announcement.title || '公告图片'"
                                    class="announcement-img"
                                />
                            </el-carousel-item>
                        </el-carousel>
                        <div v-if="currentAnnouncement.content" class="announcement-text">{{ currentAnnouncement.content }}</div>
                    </div>

                    <div class="announcement-footer">
                        <el-text v-if="announcements.length > 1" type="info" size="small">{{ currentIndex + 1 }} / {{ announcements.length }}</el-text>
                        <el-button class="announcement-close-btn" type="danger" :icon="X" @click="onClose">
                            关闭
                        </el-button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { X } from '@lucide/vue';
import { announcementAPI, type Announcement } from '@/apis/announcement';

const visible = ref(false);
const announcements = ref<Announcement[]>([]);
const currentIndex = ref(0);
const currentAnnouncement = computed(() => announcements.value[currentIndex.value] || null);

function handleCarouselChange(index: number) {
    currentIndex.value = index;
}

function onClose() {
    visible.value = false;
}

async function fetchAnnouncements() {
    try {
        const res = await announcementAPI.getActiveAnnouncements();
        if (res.code === 200 && res.data && res.data.length > 0) {
            announcements.value = res.data;
            currentIndex.value = 0;
            visible.value = true;
        }
    } catch (e) {
        console.warn('获取公告失败', e);
    }
}

onMounted(() => {
    fetchAnnouncements();
});
</script>

<style lang="scss" scoped>
.announcement-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
}

.announcement-panel {
    width: 70%;
    max-height: 92vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--card-bg);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.announcement-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: var(--el-fill-color-light, #f8f9fc);
}

.announcement-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--body-color);
    letter-spacing: 0.3px;
}

.header-close {
    color: var(--body-color);
    opacity: 0.6;

    :deep(.el-icon) {
        font-size: 20px;
        font-weight: 700;
    }

    &:hover {
        background: rgba(128, 128, 128, 0.15);
        color: var(--body-color);
        opacity: 1;
    }
}

.announcement-content {
    overflow-y: auto;
}

.announcement-carousel {
    width: 100%;
    background: #000;

    :deep(.el-carousel__arrow) {
        width: 44px;
        height: 44px;
        color: #fff;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(8px);
        transition: all 0.25s;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-50%) scale(1.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
    }

    :deep(.el-carousel__arrow .el-icon) {
        font-size: 24px;
    }
}

.announcement-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #000;
}

.announcement-text {
    line-height: 1.85;
    font-size: 15px;
    color: var(--body-color);
    white-space: pre-wrap;
    padding: 20px 24px;
    background: var(--el-fill-color-blank, #fafbfd);
}

.announcement-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    padding: 14px 24px;
    background: var(--card-bg);
}

.announcement-close-btn {
    padding: 10px 18px;
    border: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(238, 90, 90, 0.35);

    &:hover {
        background: linear-gradient(135deg, #ee5a5a 0%, #dc3d3d 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(238, 90, 90, 0.45);
    }

    &:active {
        transform: translateY(0);
    }
}

.announcement-fade-enter-active,
.announcement-fade-leave-active {
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);

    .announcement-panel {
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
}

.announcement-fade-enter-from,
.announcement-fade-leave-to {
    opacity: 0;

    .announcement-panel {
        transform: scale(0.92) translateY(20px);
        opacity: 0;
    }
}

@media (max-width: 600px) {
    .announcement-panel {
        width: 92%;
        border-radius: 12px;
    }

    .announcement-header {
        padding: 12px 16px;
    }

    .announcement-title {
        font-size: 14px;
    }

    .announcement-carousel {
        :deep(.el-carousel__arrow) {
            width: 34px;
            height: 34px;
        }

        :deep(.el-carousel__arrow .el-icon) {
            font-size: 18px;
        }
    }

    .announcement-text {
        font-size: 13px;
        padding: 14px 16px;
    }

    .announcement-footer {
        padding: 10px 16px;
    }
}
</style>
