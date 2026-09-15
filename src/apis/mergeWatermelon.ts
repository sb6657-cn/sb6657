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
): Promise<MergeWatermelonSubmitResult | null> {
    try {
        const res = await post<{ siteToken: string; score: number; topSpecies: string | null }, MergeWatermelonSubmitResult>({
            url: '/machine/merge-watermelon/score',
            data: { siteToken, score, topSpecies },
        });
        return res.flatData ?? null;
    } catch (e) {
        console.error('[MergeWatermelon] submit error', e);
        return null;
    }
}
