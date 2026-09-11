<template>
    <div class="tags-container">
        <div class="selected-tags">
            <div class="tags-title">已选标签:</div>
            <div v-if="selectedTags.length > 0" class="tags">
                <el-tag v-for="tag in selectedTags" :key="tag.dictValue" class="tag1" round @click="removeTag(tag)">
                    <div class="tag-icon-wrapper">
                        <img v-if="tag.iconUrl" :src="tag.iconUrl" class="tag-icon" />
                        <span class="tag-label">{{ tag.dictLabel }}</span>
                        <el-icon>
                            <Close />
                        </el-icon>
                    </div>
                </el-tag>
            </div>
            <div v-if="selectedTags.length === 0" class="empty-tips">暂无已选标签(点击下面标签进行筛选)</div>
        </div>
        <div class="all-tags">
            <div class="tags-title">所有标签:</div>
            <div class="tags">
                <el-tag v-for="tag in availableTags" :key="tag.dictValue" class="tag1" round @click="addTag(tag)">
                    <div class="tag-icon-wrapper">
                        <img v-if="tag.iconUrl" :src="tag.iconUrl" class="tag-icon" />
                        <span class="tag-label">{{ tag.dictLabel }}</span>
                        <el-icon>
                            <Plus />
                        </el-icon>
                    </div>
                </el-tag>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
/**
 * 标签选择器组件，点击标签可以添加或移除已选标签。两个参数，v-model:selectedTags是已选标签列表，:tags是所有标签
 * @props {memeTag[]} tags - 所有标签列表，从这里面选
 * @model {memeTag[]} selectedTags - 已选标签列表，可以视为组件输出。双向绑定的，可能被父组件改
 */
import { computed } from 'vue';
import { type getMemeTags as memeTag } from '@/types/meme';
import { Plus, Close } from '@element-plus/icons-vue';

const { tags } = defineProps<{
    tags: memeTag[];
}>();
const selectedTags = defineModel<memeTag[]>('selectedTags', { required: true });
const availableTags = computed(() => tags.filter((t) => !selectedTags.value.some((selected) => selected.dictValue === t.dictValue)));

// 添加标签
function addTag(tag: memeTag) {
    if (selectedTags.value.some((item) => item.dictValue === tag.dictValue)) return;
    selectedTags.value = [...selectedTags.value, tag];
}

// 移除标签
function removeTag(tag: memeTag) {
    selectedTags.value = selectedTags.value.filter((t) => t.dictValue !== tag.dictValue);
}
</script>
<style lang="scss" scoped>
.tags-container {
    .selected-tags,
    .all-tags {
        margin-bottom: 16px;

        .tags-title {
            font-weight: 500;
            margin-bottom: 10px;
            color: var(--body-color);
            font-size: 14px;
        }

        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .tag1 {
                margin: 0;
                cursor: pointer;
                border: 1px solid #dcdfe6;
                background-color: var(--el-fill-color-light, #f5f7fa);

                &:hover {
                    border-color: #409eff;
                    background-color: #ecf5ff;
                }

                html.dark & {
                    border-color: var(--el-border-color);

                    &:hover {
                        border-color: var(--el-color-primary);
                        background-color: var(--el-color-primary-light-9);
                    }
                }

                .tag-icon-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 4px;

                    .tag-icon {
                        width: 18px;
                        object-fit: cover;
                    }

                    .tag-label {
                        font-size: 13px;
                    }
                }
            }
        }

        .empty-tips {
            color: var(--body-color);
            font-size: 13px;
            font-style: italic;
        }
    }
}
</style>
