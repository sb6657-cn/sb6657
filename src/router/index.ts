import { createRouter, createWebHistory } from 'vue-router';
import NotFoundView from '@/views/404.vue';

const redirect = sessionStorage.getItem('spa_redirect');
if (redirect) {
    sessionStorage.removeItem('spa_redirect');
    window.history.replaceState(null, '', redirect);
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'MainLayout',
            component: () => import('@/views/MainLayout/MainLayout.vue'),
            redirect: '/home',
            children: [
                // 路由映射
                { path: 'home', name: 'Home', component: () => import('@/views/MainLayout/components/Home.vue') },
                { path: 'ChatRoom', name: 'ChatRoom', component: () => import('@/components/ChatRoom.vue') },
                { path: 'aichat', name: 'AIChat', component: () => import('@/views/MainLayout/components/AiGenerateMemes/AIChat.vue') },
                { path: 'image', name: 'image', component: () => import('@/views/MainLayout/components/image.vue') },
                { path: 'test', name: 'test', component: () => import('@/views/MainLayout/components/test.vue') },
                { path: 'Starrysky', name: 'Starrysky', component: () => import('@/views/Starrysky.vue') },
                { path: 'Tampermonkey', name: 'Tampermonkey', component: () => import('@/views/MainLayout/components/Tampermonkey.vue') },
                { path: 'UserInfo', name: 'UserInfo', component: () => import('@/views/MainLayout/components/user/components/index.vue') },
                { path: 'post-bar', name: 'post-bar', component: () => import('@/views/MainLayout/components/post-bar/post-bar-main.vue') },
                { path: 'me-post', name: 'me-post', component: () => import('@/views/MainLayout/components/post-bar/Me-Post.vue') },
                { path: 'me-memes', name: 'me-memes', component: () => import('@/views/MainLayout/components/user/components/Me-memes.vue') },
                { path: 'me-msg', name: 'me-msg', component: () => import('@/views/MainLayout/components/post-bar/Post-Message.vue') },
                { path: 'memes/:category', name: 'memes', component: () => import('@/views/MainLayout/components/memes-view.vue') },
                { path: 'matchPrediction', name: 'matchPrediction', component: () => import('@/views/MainLayout/components/match-prediction/CS2Major.vue') },
                { path: 'matchLib', name: 'matchLib', component: () => import('@/views/MainLayout/components/match-prediction/matchLib.vue') },
                { path: 'dejaVuNiko', name: 'dejaVuNiko', component: () => import('@/views/MainLayout/components/deja-vu-niko.vue') },
                { path: '15warriorsDonk', name: '15warriorsDonk', component: () => import('@/views/MainLayout/components/15warriorsDonk.vue') },
                { path: 'update', name: 'update-timeline', component: () => import('@/views/MainLayout/components/update-timeline.vue') },
                { path: 'shieldWord', name: 'shieldWord', component: () => import('@/views/MainLayout/components/shieldWord.vue') },
                { path: 'memeTop20', name: 'memeTop20', component: () => import('@/views/MainLayout/components/memeTop20.vue') },
                { path: 'stale', name: 'stale', component: () => import('@/views/MainLayout/components/stale-hot/stale.vue') },
                { path: 'hotwall', name: 'hotwall', component: () => import('@/views/MainLayout/components/stale-hot/hotwall.vue') },
                { path: 'arena', name: 'arena', component: () => import('@/views/MainLayout/components/play/arena.vue') },
                { path: 'growth', name: 'growth', component: () => import('@/views/MainLayout/components/play/growth.vue') },
                { path: 'lifecycle', name: 'lifecycle', component: () => import('@/views/MainLayout/components/keep/lifecycle.vue') },
                { path: 'checkin', name: 'checkin', component: () => import('@/views/MainLayout/components/keep/checkin.vue') },
                { path: 'lieDetector', name: 'lieDetector', component: () => import('@/views/MainLayout/components/play/lie-detector.vue') },
            ],
        },
        {
            path: '/:catchAll(.*)', // 使用正则表达式捕获所有路径
            name: 'NotFound',
            component: NotFoundView,
        },
    ],
});

export default router;

