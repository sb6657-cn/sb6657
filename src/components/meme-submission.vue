<template>
    <div class="meme-submission">
        <!-- 登录状态提示：登录后投稿会记录归属，方便用户确认 -->
        <div class="login-status-tip" :class="isLoggedIn ? 'is-logged-in' : 'is-guest'">
            <span class="tip-icon">{{ isLoggedIn ? '✅' : '👤' }}</span>
            <template v-if="isLoggedIn">
                当前已登录<b v-if="nickName">（{{ nickName }}）</b>，投稿通过审核后将记录为<b>你的烂梗</b>，可在个人主页查看。
            </template>
            <template v-else>
                当前<b>未登录</b>，投稿为匿名；<el-button class="tip-login-btn" link type="primary"
                    @click="authStore.showLogin()">点此登录</el-button>后投稿将归属于你的账号。
            </template>
        </div>

        <div class="submission-header">
            可选标签
            <el-popover :width="300">
                <template #reference>
                    <el-icon size="16">
                        <Warning />
                    </el-icon>
                </template>
                为解决烂梗分栏不足和分类不清晰问题。
                <br />
                <b>点击标签即可添加</b>
            </el-popover>
            <el-button class="submit-tag-button" link type="success">
                投稿标签
                <el-popover :width="300">
                    <template #reference>
                        <el-icon size="16">
                            <QuestionFilled />
                        </el-icon>
                    </template>
                    <b>请在上方(建议/提交)问卷投稿。</b>
                    <br />
                </el-popover>
            </el-button>
        </div>

        <tag-selector v-model:selectedTags="selectedTags" :tags="allTags" />
        <el-input v-model="barrage" maxlength="255" autocomplete="off" :autosize="{ minRows: 2, maxRows: 4 }"
            show-word-limit type="textarea" placeholder="输入你要投稿的烂梗...."></el-input>

        <div class="submission-footer">
            <div class="match-section">
                <el-checkbox v-model="isMatchSelected" :disabled="!matchData" class="match-checkbox">
                    关联赛事库
                    <el-icon class="match-help-icon" size="16">
                        <QuestionFilled />
                    </el-icon>
                </el-checkbox>
                <div v-if="matchData" class="match-details-box">
                    <div class="match-info-row">
                        <img :src="matchData.matchesImg" class="match-image" :alt="matchData.matchesName" />
                        <span class="match-name">{{ matchData.matchesName }}</span>
                    </div>
                    <div class="match-time">{{ matchData.startTime }} 至 {{ matchData.endTime }}</div>
                </div>
                <div v-else class="no-match-info">当前无正在进行的大型赛事</div>
            </div>
            <div class="button-group">
                <el-button type="primary" :loading="submitting" @click="saveBarrage">投稿</el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import httpInstance from '@/apis/httpInstance';
import tagSelector from '@/components/tag-selector.vue';
import { API } from '@/constants/backend';
import { useMemeTagsStore } from '@/stores/memeTags';
import { useAuthStore } from '@/stores/useAuthStore';
import { getToken, getTokenExpireTime } from '@/utils/cookieUtils';
import { type getMemeTags as memeTag } from '@/types/meme';
import { QuestionFilled, Warning } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { computed, ref, watch } from 'vue';

type MatchData = {
    id: number | string;
    matchesImg: string;
    matchesName: string;
    startTime: string;
    endTime: string;
};

type SubmitData = {
    tags: string;
    barrage: string;
    matchId?: number | string;
};

const props = withDefaults(
    defineProps<{
        active?: boolean;
    }>(),
    {
        active: true,
    }
);

const emit = defineEmits<{
    submitted: [];
}>();

const memeTagsStore = useMemeTagsStore();
const barrage = ref('');
const allTags = ref<memeTag[]>([]);
const selectedTags = ref<memeTag[]>([]);
const matchData = ref<MatchData | null>(null);
const isMatchSelected = ref(false);
const submitting = ref(false);

// ===== 登录状态提示 =====
// 先用本地 token 做即时判断（避免闪烁），再用后端 /machine/whoami 校准——
// 后端能从 token 解析出用户才算真登录（覆盖 token 被服务端作废的场景）。
const authStore = useAuthStore();
const isLoggedIn = ref(checkLoginState());
const nickName = ref('');

function checkLoginState(): boolean {
    const token = getToken();
    if (!token) return false;
    const expireTime = getTokenExpireTime();
    // 没记录过期时间时保守视为已登录（老版本登录可能没写 expire），有过期时间则严格校验
    return !expireTime || expireTime > Date.now();
}

/** 调后端 whoami 精确校准登录状态；失败时回退到本地 token 判断 */
function refreshLoginState() {
    const localState = checkLoginState();
    isLoggedIn.value = localState;
    if (!localState) {
        nickName.value = '';
        return;
    }
    httpInstance
        .get(API.WHOAMI)
        .then((res) => {
            const data = (res as any).data || {};
            isLoggedIn.value = !!data.loggedIn;
            nickName.value = data.nickName || data.username || '';
        })
        .catch(() => {
            // 请求失败（网络等）保持本地判断结果，不打扰用户
        });
}

// 弹窗每次打开、或登录弹窗关闭后，都刷新一次登录状态
watch(
    () => props.active,
    (isActive) => {
        if (isActive) {
            refreshLoginState();
            getInProgressMatch();
        }
    },
    { immediate: true }
);
watch(
    () => authStore.loginSuccessTick,
    () => {
        // 登录成功广播：token 写入 cookie 后立刻重新校准
        refreshLoginState();
    }
);
watch(
    () => authStore.loginVisible,
    (loginVisible, prevVisible) => {
        // 登录弹窗从开到关（含用户手动关闭）→ 兜底再校准一次
        if (prevVisible && !loginVisible) {
            refreshLoginState();
        }
    }
);

memeTagsStore.tagsLoaded.then(() => {
    allTags.value = memeTagsStore.memeTags;
});

function getInProgressMatch() {
    httpInstance
        .get<MatchData | null>('/machine/InProgressMatch')
        .then((res) => {
            if (res.code === 200 && res.data) {
                matchData.value = res.data;
            } else {
                matchData.value = null;
            }
        })
        .catch((err) => {
            console.error('Failed to fetch in progress match:', err);
            matchData.value = null;
        });
}

function saveBarrage() {
    const selectedValues = selectedTags.value.map((t) => t.dictValue);
    if (selectedValues.length === 0 || !barrage.value) {
        ElNotification.error('请选择标签或输入弹幕');
        return;
    }

    if (selectedValues.length > 5) {
        ElNotification.error('最少一个标签，最多五个标签。');
        return;
    }

    const submitData: SubmitData = {
        tags: selectedValues.join(','),
        barrage: barrage.value,
    };

    if (isMatchSelected.value && matchData.value) {
        submitData.matchId = matchData.value.id;
    }

    submitting.value = true;
    httpInstance
        .post(API.SUBMIT_MEME, submitData)
        .then((res) => {
            barrage.value = '';
            isMatchSelected.value = false;
            if (res.code === 200) {
                ElNotification.success('投稿成功，待审核(一天内)');
                emit('submitted');
            } else if (res.code === 500) {
                ElNotification.error('烂梗已经有了，勿重复提交');
            } else {
                ElNotification.error('请求失败');
            }
        })
        .catch((err) => {
            console.error('投稿失败', err);
            ElNotification.error('请求失败');
        })
        .finally(() => {
            submitting.value = false;
        });
};
</script>

<style scoped lang="scss">
.meme-submission {
    width: 100%;
    line-height: 25px;
    box-sizing: border-box;

    .login-status-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        margin-bottom: 10px;
        padding: 7px 12px;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.5;
        box-sizing: border-box;

        .tip-icon {
            flex-shrink: 0;
            font-size: 14px;
        }

        .tip-login-btn {
            font-size: 13px;
            padding: 0;
            vertical-align: baseline;
        }

        &.is-logged-in {
            background-color: rgba(61, 179, 2, 0.08);
            color: var(--body-color);
            border: 1px solid rgba(61, 179, 2, 0.25);
        }

        &.is-guest {
            background-color: var(--el-fill-color-light, #f5f7fa);
            color: var(--body-color);
            border: 1px dashed var(--el-border-color, #dcdfe6);
        }
    }

    .submission-header {
        width: 100%;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 10px;

        .submit-tag-button {
            margin-left: auto;
        }
    }

    .submission-footer {
        width: 100%;
        margin-top: 10px;
        border-radius: 4px;
        box-sizing: border-box;

        .match-section {
            display: flex;
            align-items: center;
            flex: 1;
            flex-wrap: wrap;
            gap: 10px;
            width: 100%;
            padding: 12px;
            border-radius: 4px;
            background-color: var(--el-fill-color-light, #f5f7fa);
            box-sizing: border-box;

            .match-checkbox {
                margin-right: 10px;
                white-space: nowrap;

                .match-help-icon {
                    color: #3db302ff;
                }
            }

            .match-details-box {
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
                justify-content: center;
                min-width: 0;
                padding: 5px 10px;
                border-radius: 4px;
                background-color: var(--el-fill-color-lighter, rgba(17, 169, 131, 0.12));
                box-sizing: border-box;

                .match-info-row {
                    display: flex;
                    align-items: center;

                    .match-image {
                        width: 30px;
                        height: 30px;
                        margin-right: 10px;
                        object-fit: contain;
                    }

                    .match-name {
                        max-width: 150px;
                        overflow: hidden;
                        color: #303133;
                        font-size: 14px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }

                .match-time {
                    margin-top: 4px;
                    color: var(--body-color);
                    font-size: 12px;
                }
            }

            .no-match-info {
                flex-shrink: 0;
                padding: 5px 10px;
                border-radius: 4px;
                color: var(--body-color);
                font-size: 14px;
                box-sizing: border-box;
            }
        }

        .button-group {
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
        }
    }
}

@media screen and (max-width: 768px) {
    .meme-submission {
        .submission-header {
            .submit-tag-button {
                margin-left: 0;
            }
        }

        .submission-footer {
            .match-section {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;

                .match-details-box,
                .no-match-info {
                    width: 100%;
                }
            }

            .button-group {
                justify-content: center;
            }
        }
    }
}
</style>
