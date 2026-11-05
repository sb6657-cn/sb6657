const optimisticCounts = new Map<string, number>();

export function recordOptimisticCopy(memeId: string | number, nextCount?: number): number {
    const key = String(memeId);
    const prev = optimisticCounts.get(key) ?? 0;
    const resolvedNext = typeof nextCount === 'number' ? nextCount : prev + 1;
    const target = Math.max(prev + 1, resolvedNext);
    optimisticCounts.set(key, target);
    return target;
}

export function getOptimisticCopyCount(memeId: string | number, baselineCount: number): number {
    const key = String(memeId);
    const recorded = optimisticCounts.get(key);
    if (recorded !== undefined) {
        return Math.max(baselineCount, recorded);
    }
    return baselineCount;
}

export function applyOptimisticCopyCount<T extends { id?: string | number; copyCount?: number }>(item: T): T {
    if (item && item.id !== undefined && typeof item.copyCount === 'number') {
        item.copyCount = getOptimisticCopyCount(item.id, item.copyCount);
    }
    return item;
}

export function applyOptimisticToRawMeme<T extends { id?: string | number; cnt?: string | number }>(item: T): T {
    if (item && item.id !== undefined && item.cnt !== undefined) {
        const current = Number(item.cnt) || 0;
        const adjusted = getOptimisticCopyCount(item.id, current);
        item.cnt = typeof item.cnt === 'number' ? adjusted : String(adjusted);
    }
    return item;
}
