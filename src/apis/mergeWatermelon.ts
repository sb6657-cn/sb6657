import { get, post } from './httpInstance';

export interface MergeWatermelonLeaderboardItem {
    id: number;
    siteToken: string;
    nickname: string | null;
    score: number;
    topSpecies: string | null;
    createTime: string;
}

export interface MergeWatermelonRankInfo {
    bestScore: number;
    rank: number;
}

export interface MergeWatermelonSubmitResult {
    rank: number;
    bestScore: number;
    /** 本局是否刷新了个人最高分 */
    improved: boolean;
    /** 命中服务端提交限流：未写库，返回的是当前名次 */
    throttled?: boolean;
    /** 命中防作弊校验被拒：未写库，返回的是当前名次 */
    rejected?: boolean;
}

/** 拉取前 N 名排行榜 */
export async function fetchMergeWatermelonLeaderboard(top = 100): Promise<MergeWatermelonLeaderboardItem[]> {
    const res = await get<MergeWatermelonLeaderboardItem[]>(`/machine/merge-watermelon/leaderboard?top=${top}`);
    return res.flatData ?? [];
}

/** 拉取个人排名与最高分 */
export async function fetchMergeWatermelonRank(siteToken: string): Promise<MergeWatermelonRankInfo> {
    const res = await get<MergeWatermelonRankInfo>(`/machine/merge-watermelon/rank/${encodeURIComponent(siteToken)}`);
    return res.flatData ?? { bestScore: 0, rank: -1 };
}

/** 提交一局分数 */
export async function submitMergeWatermelonScore(
    siteToken: string,
    score: number,
    topSpecies: string | null,
    finished: boolean,
): Promise<MergeWatermelonSubmitResult | null> {
    try {
        const res = await post<{ siteToken: string; score: number; topSpecies: string | null; finished: boolean }, MergeWatermelonSubmitResult>({
            url: '/machine/merge-watermelon/score',
            data: { siteToken, score, topSpecies, finished },
        });
        return res.flatData ?? null;
    } catch (e) {
        console.error('[MergeWatermelon] submit error', e);
        return null;
    }
}
