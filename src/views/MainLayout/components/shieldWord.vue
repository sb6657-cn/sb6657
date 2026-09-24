<template>
    <div class="card main">
        <div class="header-section">
            <h2 class="title">屏蔽词收集列表
                <el-button style="margin-left: 10px;" type="primary" @click="dialogVisible = true">
                    屏蔽词投稿
                </el-button>
                <span class="shield-word-description">将会在您复制烂梗时提示是否包含屏蔽词(包含屏蔽词烂梗可能不能在直播间发送)</span>
            </h2>
            <el-button @click="showMyShieldWordsDialog = true">我投稿的屏蔽词</el-button>
        </div>

        <div class="card-list" v-loading="loading">
            <div class="card shield-card" v-for="item in list" :key="item.id" :class="{ 'disabled': item.isShieldWord === 0 }">
                <div v-if="item.isShieldWord === 0" class="not-word-stamp">这不是屏蔽词</div>
                <div>屏蔽词：<span class="word">{{ item.shieldWord }}</span> </div>
                <div class="time">投稿时间：{{ item.submitTime }}</div>

                <div class="btn-group">
                    <el-button type="success" @click="handleIsWord(item.id)">
                        这是屏蔽词：<span>{{ item.isWordNum }}</span>
                    </el-button>
                    <el-button type="danger" @click="handleNotWord(item.id)">
                        这不是屏蔽词：<span>{{ item.notWordNum }}</span>
                    </el-button>
                </div>
            </div>
        </div>

        <div class="pagination">
            <el-pagination 
                v-model:current-page="pageNum" 
                v-model:page-size="pageSize"
                :size="isMobile ? 'small' : ''"
                :page-sizes="[10, 20, 50, 100]"
                background layout="prev, pager, next, sizes, total"
                :total="total"
                @current-change="getList"
                @size-change="getList"
            />
        </div>
    </div>
    <el-backtop :right="50" :bottom="50">UP</el-backtop>

    <!-- 屏蔽词投稿弹窗 -->
    <el-dialog v-model="dialogVisible" title="屏蔽词投稿" width="500px" :close-on-click-modal="false">
        <el-form :model="submitForm" :rules="formRules" ref="formRef" label-width="65px">
            <el-form-item label="屏蔽词" prop="shieldWord">
                <el-input v-model="submitForm.shieldWord" placeholder="请输入要投稿的屏蔽词" maxlength="10" show-word-limit
                    clearable />
            </el-form-item>
            <span>⁕由于屏蔽词是某个词语，故限制长度为10</span>
            <TurnstileWidget v-if="dialogVisible" ref="turnstileRef" action="shield_submit" v-model="turnstileToken" />
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleDialogCancel">取消</el-button>
                <el-button type="primary" @click="handleSubmitShieldWord" :loading="submitLoading">
                    提交
                </el-button>
            </div>
        </template>
    </el-dialog>

    <!-- 我投稿的屏蔽词弹窗 -->
    <el-dialog v-model="showMyShieldWordsDialog" title="我投稿的屏蔽词" width="710px">
        <el-table :data="myShieldWordList" stripe v-loading="myShieldWordLoading" style="width: 100%">
            <el-table-column prop="shieldWord" label="屏蔽词" width="200" />
            <el-table-column prop="submitTime" label="投稿时间" width="180" />
            <el-table-column prop="reviewTime" label="审核时间" width="180" />
            <el-table-column prop="state" label="状态" width="120">
                <template #default="scope">
                    <el-tag :type="getTagType(scope.row.state)">
                        {{ getTagText(scope.row.state) }}
                    </el-tag>
                </template>
            </el-table-column>
        </el-table>
        <div class="pagination" style="margin-top: 20px;">
            <el-pagination
                v-model:current-page="myShieldWordPageNum"
                v-model:page-size="myShieldWordPageSize"
                :size="isMobile ? 'small' : ''"
                :page-sizes="[10, 20, 50, 100]"
                background
                layout="prev, pager, next, sizes, total"
                :total="myShieldWordTotal"
                @current-change="getMyShieldWordList"
                @size-change="getMyShieldWordList"
            />
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="showMyShieldWordsDialog = false">关闭</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import httpInstance from '@/apis/httpInstance';
import TurnstileWidget from '@/components/TurnstileWidget.vue';
import { useIsMobile } from '@/composables/useIsMobile';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { onMounted, ref, watch } from 'vue';

const isMobile = useIsMobile();
const turnstileRef = ref();
const turnstileToken = ref('');

interface ShieldItem {
    id: number;
    shieldWord: string;
    submitTime: string;
    isWordNum: number;
    notWordNum: number;
    isShieldWord: number;
}

interface MyShieldWordItem {
    id: number;
    shieldWord: string;
    submitTime: string;
    reviewTime: string;
    state: string; // '1' 表示已通过，其他表示待审核
}

interface PageData<T> {
    list: T[];
    total: number;
}
const getTagType = (state: string) => {
    switch (state) {
        case '1': return 'success';  // 已通过
        case '2': return 'danger';   // 未通过
        default: return 'info';      // 待审核
    }
};

const getTagText = (state: string) => {
    switch (state) {
        case '1': return '已通过';
        case '2': return '未通过';
        default: return '待审核';
    }
};
const list = ref<ShieldItem[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(50);
const total = ref(0);

// 投稿弹窗相关
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const submitForm = ref({
    shieldWord: '',
});

// 我投稿的屏蔽词弹窗相关
const showMyShieldWordsDialog = ref(false);
const myShieldWordList = ref<MyShieldWordItem[]>([]);
const myShieldWordLoading = ref(false);
const myShieldWordPageNum = ref(1);
const myShieldWordPageSize = ref(20);
const myShieldWordTotal = ref(0);

// 表单验证规则
const formRules: FormRules = {
    shieldWord: [
        { required: true, message: '请输入屏蔽词', trigger: 'blur' },
        { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' },
    ],
};

// 获取屏蔽词列表
const getList = async () => {
    loading.value = true;
    try {
        const res = await httpInstance.get<PageData<ShieldItem>>('/machine/getShieldWordList', {
            params: {
                pageNum: pageNum.value,
                pageSize: pageSize.value,
            },
        });

        if (res.code === 200) {
            list.value = res.data.list;
            total.value = res.data.total;
        } else {
            ElMessage.error(res.msg || '加载失败');
        }
    } catch (e) {
        ElMessage.error('请求失败，请检查接口连接');
    } finally {
        loading.value = false;
    }
};

// 提交“这是屏蔽词”
const handleIsWord = async (id: number) => {
    try {
        const res = await httpInstance.get('/machine/addIsShieldWord', {
            params: { id },
        });
        if (res.code === 200) {
            ElMessage.success('提交成功 ✅');
            getList();
        } else {
            ElMessage.error(res.msg || '提交失败');
        }
    } catch {
        ElMessage.error('请求失败');
    }
};

// 提交"这不是屏蔽词"
const handleNotWord = async (id: number) => {
    try {
        const res = await httpInstance.get('/machine/addNotShieldWord', {
            params: { id },
        });
        if (res.code === 200) {
            ElMessage.success('提交成功 ✅');
            getList();
        } else {
            ElMessage.error(res.msg || '提交失败');
        }
    } catch {
        ElMessage.error('请求失败');
    }
};

// 提交屏蔽词投稿
const handleSubmitShieldWord = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
        if (!valid) return;

        if (!turnstileToken.value) {
            ElMessage.warning('请先完成人机安全验证');
            return;
        }

        submitLoading.value = true;
        try {
            const res = await httpInstance.get('/machine/addShieldWord', {
                params: {
                    shieldWord: submitForm.value.shieldWord.trim(),
                },
                headers: {
                    'cf-turnstile-response': turnstileToken.value,
                },
            });

            if (res.code === 200) {
                ElMessage.success('投稿成功 ✅');
                handleDialogCancel();
                getList(); // 刷新列表
            } else {
                ElMessage.error(res.msg || '投稿失败');
                turnstileRef.value?.reset();
            }
        } catch (error) {
            console.error('投稿失败:', error);
            ElMessage.error('请求失败，请检查网络连接');
            turnstileRef.value?.reset();
        } finally {
            submitLoading.value = false;
        }
    });
};

// 取消/关闭弹窗
const handleDialogCancel = () => {
    dialogVisible.value = false;
    submitForm.value.shieldWord = '';
    turnstileToken.value = '';
    turnstileRef.value?.reset();
    formRef.value?.resetFields();
};

// 获取我投稿的屏蔽词列表
const getMyShieldWordList = async () => {
    myShieldWordLoading.value = true;
    try {
        const res = await httpInstance.get<PageData<MyShieldWordItem>>('/machine/getMyShieldWordList', {
            params: {
                pageNum: myShieldWordPageNum.value,
                pageSize: myShieldWordPageSize.value,
            },
        });

        if (res.code === 200) {
            myShieldWordList.value = res.data.list;
            myShieldWordTotal.value = res.data.total;
        } else if (res.code === 401) {
            ElMessage.error(res.msg || '请先登录');
        }
    } catch (e) {
        ElMessage.error('请先登录');
    } finally {
        myShieldWordLoading.value = false;
    }
};

// 监听弹窗打开，自动加载数据
watch(showMyShieldWordsDialog, (visible) => {
    if (visible) {
        myShieldWordPageNum.value = 1;
        getMyShieldWordList();
    }
});

onMounted(() => {
    getList();
});
</script>

<style scoped lang="scss">
.main {
    width: 93%;
    flex-wrap: wrap;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;

    h2 {
        margin: 0;
    }

    span {
        display: block;
        margin-top: 8px;
        font-size: 14px;
        color: var(--body-color);
        opacity: 0.7;
    }

    .shield-word-description {
        margin: 2.33em 0;
        font-size: 0.67em;
        font-weight: bold;
        color: inherit;
    }
}

.shield-container {
    padding: 20px;
    background: var(--card-bg);
    border-radius: 16px;
    box-shadow: var(--card-shadow);
    min-height: 100vh;

    .title {
        font-size: 22px;
        font-weight: 600;
        color: var(--body-color);
        margin-bottom: 20px;
        text-align: center;
    }

    .pagination {
        margin-top: 140px;
        text-align: center;
        display: flex;
        justify-content: center;
        margin-top: 16px;
        margin-bottom: 40px;
    }
}

/* 卡片列表：使用flex布局实现多列排列 */
.card-list {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
}

/* 每个屏蔽词的卡片样式 */
.shield-card {
    position: relative;
    flex: 0 1 calc(25% - 16px);
    /* 一行4个卡片 */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 150px;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    background: var(--el-fill-color-blank, #fafafa);
    transition: all 0.2s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    .word {
        font-size: 18px;
        font-weight: 600;
        color: var(--body-color);
        margin-bottom: 8px;
        word-break: break-all;
    }

    .time {
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
    }

    .count {
        font-size: 13px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 10px;

        .yes {
            color: #27ae60;
        }

        .no {
            color: #e74c3c;
        }
    }

    .btn-group {
        display: flex;
        justify-content: space-between;
    }

    .not-word-stamp {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-20deg);
        font-size: 22px;
        font-weight: 800;
        color: rgba(255, 0, 0, 0.7);
        border: 3px solid rgba(255, 0, 0, 0.6);
        border-radius: 10px;
        padding: 6px 18px;
        text-transform: uppercase;
        letter-spacing: 2px;
        pointer-events: none;
        background-color: rgba(255, 255, 255, 0.5);
        z-index: 10;
        box-shadow: 0 0 6px rgba(255, 0, 0, 0.3);
    }
    &.disabled {
    cursor: not-allowed;
    .btn-group {
      pointer-events: none;

      .el-button {
        cursor: not-allowed;
      }
    }
  }

}

@media (max-width: 1200px) {
    .shield-card {
        flex: 0 1 calc(33.333% - 16px);
    }
}

@media (max-width: 768px) {
    .main {
        width: 100%;
    }

    .shield-card {
        flex: 0 1 calc(50% - 16px);
    }
}

@media (max-width: 500px) {
    .main {
        width: 100%;
    }

    .shield-card {
        flex: 0 1 100%;
    }
}
</style>
