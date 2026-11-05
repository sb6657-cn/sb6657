import httpInstance, { type res, post, get } from '@/apis/httpInstance';
import { API } from '@/constants/backend';
import { MemeCategory } from '@/constants/backend';
import type { getHotMeme_res, getMemeList_res, getData, getMemeTags, searchMeme_req, searchMeme_res, getMemeList_meme } from '@/types/meme';
import { applyOptimisticCopyCount, applyOptimisticToRawMeme } from '@/utils/copyTracker';

async function getHotMeme(url: string, tips: string) {
    try {
        const res: getHotMeme_res = await httpInstance.get(url);
        if (!res?.data?.[0]?.barrage) {
            console.log(`获取${tips}烂梗失败`, res);
            return false;
        }
        const memeArr: Meme[] = res.data.map((item) => {
            return applyOptimisticCopyCount({
                tags: item.tags,
                content: item.barrage,
                id: `${item.barrageId}`,
                copyCount: Number(item.cnt) || 0,
                submitTime: item.submitTime,
                hotDateTime: item.hotDateTime || undefined,
            });
        });
        return memeArr;
    } catch (err: any) {
        console.log(`获取${tips}烂梗失败`, err);
        return false;
    }
}
export function getHotMeme24h() {
    return getHotMeme(API.GET_HOT_MEME_24h, '24h热门');
}
export function getHotMeme7d() {
    return getHotMeme(API.GET_HOT_MEME_7D, '七天热门');
}

// submitTime格式是yyyy-mm-dd
export async function searchMeme(req: searchMeme_req): Promise<res<searchMeme_res>> {
    console.log(`搜索词: ${req.barrage}, 标签: ${req.tags}, 投稿时间: ${req.submitTime}, 排序: ${req.sort}, 每页烂梗数: ${req.pageSize}, 页数: ${req.pageNum}`);
    const res = await post({
        url: API.SEARCH_MEME,
        data: req,
    });
    return res;
}

export async function getMemeList(category: string, pageIndex: number, pageSize: number, tags?: string) {
    console.log(`请求烂梗分类: ${category}, 页数: ${pageIndex}, 每页烂梗数: ${pageSize}`);
    try {
        const api = MemeCategory.find((item) => item.category === category)?.api;
        if (!api) {
            throw new Error('未找到此分类');
        }
        const res: getMemeList_res = await httpInstance.get(api, {
            params: {
                tags: tags,
                pageNum: pageIndex,
                pageSize: pageSize,
            },
        });
        if (res.data?.list?.length <= 0) {
            throw new Error('请求到的烂梗列表为空');
        }
        const memeArr: Meme[] = res.data.list.map((item) => {
            return applyOptimisticCopyCount({
                tags: item.tags,
                content: item.barrage,
                id: item.id,
                category: category,
                copyCount: +item.cnt,
                likes: +item.likes,
                submitTime: item.submitTime,
            });
        });
        return {
            memeArr,
            total: res.data.total,
        };
    } catch (err: any) {
        console.error('请求烂梗列表失败', err);
        return false;
    }
}

export async function getMemeListByCopyCount(pageIndex: number, pageSize: number, tags: string) {
    console.log(`按复制次数请求烂梗列表, 页数: ${pageIndex}, 每页烂梗数: ${pageSize}`);
    try {
        const res: getMemeList_res = await httpInstance.get(API.GET_SORTED_ALL_MEME, {
            params: {
                tags,
                pageNum: pageIndex,
                pageSize,
            },
        });
        if (res.data?.list?.length <= 0) {
            throw new Error('请求到的烂梗列表为空');
        }
        const memeArr: Meme[] = res.data.list.map((item) => {
            return applyOptimisticCopyCount({
                tags: item.tags,
                content: item.barrage,
                id: item.id,
                category: 'allbarrage',
                copyCount: +item.cnt,
                likes: +item.likes,
                submitTime: item.submitTime,
            });
        });
        return {
            memeArr,
            total: res.data.total,
        };
    } catch (err: any) {
        console.error('按复制次数请求烂梗列表失败', err);
        return false;
    }
}

export async function getMemeTags() {
    const res: getData<getMemeTags[]> = await httpInstance.get(API.GET_MEME_TAGS);
    if (res.code !== 200) {
        throw new Error(res.msg);
    }
    return res.data;
}

export async function getRandomMeme(): Promise<res<getMemeList_meme>> {
    const res = await get(API.GET_RAND_ONE_MEME);
    if (res?.flatData) {
        applyOptimisticToRawMeme(res.flatData);
    }
    return res;
}
