<template>
    <div class="sidebar">
        <el-menu router class="sidebar-el-menu" :default-active="route.path">
            <el-menu-item v-for="category in MemeCategory" :key="category.path" :index="category.path">
                <div class="sidebar-icon">
                    <img :src="category.icon" alt="" />
                </div>
                <span>{{ category.text }}</span>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<script setup lang="ts">
import { MemeCategory } from '@/constants/backend';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<style lang="scss" scoped>
.sidebar {
    width: auto;
    border-right: 0px solid #ddd;
    min-height: calc(100vh - 60px);

    .sidebar-el-menu {
        top: 55px;
        position: sticky;
        border: none;
        margin-right: auto;
    }

    .sidebar-icon {
        height: 18px;
        width: 18px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 5px;

        img {
            height: 18px;
            width: 18px;
        }
    }

    :deep(.el-menu) {
        background-color: transparent;
    }

    :deep(.el-menu-item) {
        color: black;
        background-color: transparent;
        border-radius: 5px;

        &.is-active {
            background-color: rgba(255, 255, 255, 0.5);
            color: black;
        }

        &:hover {
            outline: 0;
            color: #2e95fb;
            background: linear-gradient(270deg, #f2f7fc 0%, #fefefe 100%);
        }
    }

    html.dark & {
        background: var(--sidebar-bg);

        :deep(.el-menu-item) {
            color: var(--sidebar-text);
            background-color: transparent;

            &.is-active {
                background-color: var(--el-color-primary-light-8, rgba(17, 169, 131, 0.2));
                color: var(--sidebar-text);
            }

            &:hover {
                color: var(--el-color-primary);
                background: var(--el-fill-color-light, rgba(255, 255, 255, 0.1));
            }
        }
    }
}

.menu-icon {
    height: 18px;
    margin-right: 10px;
}
</style>
