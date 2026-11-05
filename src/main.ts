import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { MorphIcon } from 'morphicons/vue';

import '@/assets/css/index.scss';
import '@/assets/css/global.css';
import '@/assets/css/dark.css';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(ElementPlus, {
    locale: zhCn,
});
app.use(pinia);
app.component('MorphIcon', MorphIcon);

// 设置全局定时器
setInterval(() => {
    location.reload();
}, 86400000);

//生产环境去除console
const VITE_NODE_ENV = import.meta.env.VITE_NODE_ENV;
if (VITE_NODE_ENV !== 'development') {
    console.log = function () {};
    //console.error = function(){}
    console.dir = function () {};
    console.warn = function () {};
}

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.mount('#app');
