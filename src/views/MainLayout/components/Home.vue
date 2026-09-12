<template>
    <div class="home">
        <div class="boom">
            <img src="https://sb6657oss.wishao.fun/6657boom.webp" alt="6657boom" class="boom6657" />
        </div>
        <div class="cards-container">
            <div class="card first-card">
                <HomeIntro />
            </div>
            <div class="card second-card">
                <DidYouKnow />
            </div>
        </div>
        <div class="card third-card">
            <RandomMeme />
        </div>
        <HomeNowStrip />
        <HomePlaza />
        <el-backtop :right="50" :bottom="50" />
        <ChatRoom class="ChatRoom card"></ChatRoom>
        <HomeWordCloudPanel v-if="isMobile" class="mobile-word-cloud" />
        <HomeCheckinStrip v-if="isMobile" class="mobile-checkin" />
    </div>
</template>

<script setup lang="ts">
import ChatRoom from '@/components/ChatRoom.vue';
import DidYouKnow from '@/components/home/didYouKnow.vue';
import HomeIntro from '@/components/home/homeIntro.vue';
import HomeCheckinStrip from '@/components/home/home-checkin-strip.vue';
import HomeNowStrip from '@/components/home/home-now-strip.vue';
import HomePlaza from '@/components/home/home-plaza.vue';
import RandomMeme from '@/components/home/random-meme.vue';
import { useIsMobile } from '@/composables/useIsMobile';
import HomeWordCloudPanel from '@/views/MainLayout/components/right-sidebar/HomeWordCloudPanel.vue';

const isMobile = useIsMobile();
</script>

<style scoped lang="scss">
.home {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .boom {
        height: 150px;

        .boom6657 {
            height: 100%;
            border-radius: 10px;
        }
    }

    .cards-container {
        width: 100%;
        display: flex;
        gap: 8px;
        margin-top: 10px;
        align-items: stretch;
    }

    .card {
        width: 100%;
        line-height: 25px;

        &.first-card,
        &.second-card {
            flex: 1;
            margin-top: 0;
        }

        &.third-card {
            margin-top: 8px;
            padding: 12px;
        }
    }
}

.ChatRoom {
    margin: 10px 0;
}

@media (min-width: 601px) {
    .ChatRoom {
        display: none;
    }

    .mobile-word-cloud {
        display: none;
    }
}

@media (max-width: 768px) {
    .home {
        .cards-container {
            flex-direction: column;
        }
    }
}

@media (max-width: 600px) {
    .home {
        width: 100%;

        .boom {
            height: 150px;

            .boom6657 {
                margin-top: 6px;
                height: 125px;
            }
        }

        .mobile-word-cloud,
        .mobile-checkin {
            margin-top: 10px;
            width: 100%;
        }
    }
}
</style>
