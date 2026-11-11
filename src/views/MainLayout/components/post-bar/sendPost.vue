<template>
  <div class="post-form">
    <el-card>
      <div class="form-header">
        <h3>发帖</h3>
        <el-input type="textarea" v-model="content" placeholder="发布帖子...   使用AI辅助人工自动审核，请注意发言规范。" maxlength="299"
          show-word-limit />
        <el-checkbox v-model="haveMeme" size="large">
          关联烂梗 <span v-if="haveMeme"><Info :size="14" style="vertical-align: middle; margin: 0 2px;" /> 先在左边搜索然后右边选择一条关联⬇️</span>
        </el-checkbox>
        <span v-if="haveMeme" style="display: flex; gap: 10px;">
          <el-input v-model="searchMemeStr" placeholder="查找烂梗,点击搜索后右边选择关联" :style=searchMemeInputCss />
          <el-button style="width: 70px;" type="primary" @click="queryBarrage">搜索</el-button>
          <el-cascader  v-if="data.filteredItems.length" :options="cascaderOptions"
            :props="{ checkStrictly: true, emitPath: false, label: 'barrage', value: 'id' }" clearable
            teleported="true" popper-class="barrage-cascader-popper" placeholder="选择关联的烂梗" v-model="selectedBarrageId"
            style="width: 100%;word-wrap: break-word;
word-break: break-all;" />
        </span>
      </div>
      <div class="form-footer">
        <el-checkbox v-model="agree" size="large">
          已同意
          <el-link type="primary" @click="openCommunityNorms = true">《社区规范》</el-link>
          ，不发布违反规范内容
        </el-checkbox>
        <el-button type="primary" @click="submitPost" :disabled="agree === false">发布</el-button>
      </div>
    </el-card>
  </div>
  <el-dialog v-model="openCommunityNorms" title="社区规范与隐私政策" width="800">
    <div v-html="CommunityNorms"></div>
  </el-dialog>
</template>

<script setup lang="ts">
import { Info } from '@lucide/vue';
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import httpInstance from '@/apis/httpInstance'
import { CommunityNorms } from '@/common/CommunityNorms'
import { API } from '@/constants/backend';
const agree = ref(false)
const openCommunityNorms = ref(false)
const content = ref('')
const haveMeme = ref(false)
const searchMemeStr = ref('')
const selectedBarrageId = ref<number | null>(null)

watch(haveMeme, (enabled) => {
    if (!enabled) selectedBarrageId.value = null;
});

interface BarrageSearchItem {
  id: number
  barrage: string
}

interface BarrageSearchData {
  list: BarrageSearchItem[]
}

const data = reactive<{ filteredItems: BarrageSearchItem[] }>({
  filteredItems: [],
})

const queryBarrage = () => {
  httpInstance.post<BarrageSearchData>(API.SEARCH_MEME, {
    barrage: searchMemeStr.value
  }).then(res => {
    data.filteredItems = res.data.list || [];
  }).catch(err => {
    console.error('搜索失败', err);
  });
}
const searchMemeInputCss = computed(() => {
  return searchMemeStr.value === '' ? 'width: 80%;' : 'width: 20%;'
})



const cascaderOptions = computed(() =>
  data.filteredItems.map(item => ({
    id: item.id,
    barrage: item.barrage
  }))
)
const submitPost = async () => {
  if (!content.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }

  try {
    const res = await httpInstance.post('/machine/Post/ReviewPost/submit', {
      barrageId: haveMeme.value ? selectedBarrageId.value : null,
      content: content.value.trim()
    })

    if (res.code === 200) {
      ElMessage.success('发帖成功！等待审核中～')
      content.value = ''
      haveMeme.value = false;
    } else {
      ElMessage.error(res.msg || '发帖失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，发帖失败')
  }
}
</script>

<style scoped lang="scss">

.barrage-cascader-popper{
  width: 100%;
  max-width: 400px;
  min-width: 200px;
  word-wrap: break-word;
  word-break: break-all;
  .el-cascader-node__label{
    word-wrap: break-word;
    word-break: break-all;
  }
}
.post-form:not(:first-child) {
  width: 60%;
  margin: 5px auto;
}

.form-header {
  margin-bottom: 10px;
}

.form-footer {
  text-align: right;
}

@media (max-width: 600px) {
  .post-form {
    width: 100%;
  }

  .form-header {
    margin-bottom: 5px;
  }

  .form-footer {
    text-align: center;
  }
  .barrage-cascader-popper {
    width: 100%;
    max-width: 100%; /* 确保最大宽度不超过屏幕宽度 */
    min-width: 200px;
    word-wrap: break-word;
    word-break: break-all;

    .el-cascader-node__label {
      word-wrap: break-word;
      word-break: break-all;
      white-space: normal; /* 确保文本能够换行 */
    }
  }
}
</style>
