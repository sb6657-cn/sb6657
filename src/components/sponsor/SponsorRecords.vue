<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { sponsorAPI, type SponsorPageResult, type SponsorPublicItem } from '@/apis/sponsor';
import { sponsorName, sponsorTime } from '@/utils/sponsorDisplay';

const records = ref<SponsorPublicItem[]>([]);
const loading = ref(false);
const failed = ref(false);
const hasMore = ref(true);
let nextPage = 1;

async function loadPage() {
    if (loading.value || !hasMore.value) return;
    loading.value = true;
    failed.value = false;
    try {
        const response = await sponsorAPI.getList(nextPage, 50);
        // 旧接口直接返回分页字段，包装后的响应放在 data。
        const page = 'rows' in response ? (response as unknown as SponsorPageResult) : response.data;
        records.value.push(...page.rows);
        hasMore.value = page.rows.length > 0 && records.value.length < page.total;
        nextPage++;
    } catch {
        failed.value = true;
    } finally {
        loading.value = false;
    }
}

function onScroll(event: Event) {
    const list = event.currentTarget as HTMLElement;
    if (!failed.value && list.scrollHeight - list.scrollTop - list.clientHeight <= 50) loadPage();
}

onMounted(loadPage);
</script>

<template>
    <section class="records">
        <h3>最近赞赏</h3>
        <div class="records-list" tabindex="0" aria-label="最近赞赏记录" @scroll.passive="onScroll">
            <ul>
                <li v-for="item in records" :key="item.sponsorId">
                    <div class="identity">
                        <b>{{ sponsorName(item) }}</b>
                        <span class="details">
                            <span class="channel-icon" :class="item.payType === '支付宝' ? 'alipay-mark' : 'wechat'" role="img" :aria-label="item.payType || '微信'"></span>
                            <time :title="item.sponsorTime">{{ sponsorTime(item.sponsorTime) }}</time>
                        </span>
                    </div>
                    <strong class="amount">¥{{ Number(item.amount).toFixed(2) }}</strong>
                    <p v-if="item.message?.trim()" class="message"><span>“</span>{{ item.message }}<span>”</span></p>
                    <p v-else class="no-message">水友默默支持，未留留言～</p>
                </li>
            </ul>
            <p v-if="failed" class="status">赞赏记录加载失败，<el-link @click="loadPage">重新加载</el-link></p>
            <p v-else-if="loading" class="status" role="status">正在加载…</p>
            <p v-else-if="!records.length" class="status">暂无赞赏记录</p>
            <p v-else-if="!hasMore" class="status">已展示全部赞赏</p>
        </div>
    </section>
</template>

<style scoped lang="scss" src="./sponsor-records.scss"></style>
