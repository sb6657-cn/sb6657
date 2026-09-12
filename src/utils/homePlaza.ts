export const LIFECYCLE_STAGES = [
    { key: 'BIRTH', name: '新生儿', icon: '🌱' },
    { key: 'BOOM', name: '爆发期', icon: '🔥' },
    { key: 'STALE', name: '烂大街', icon: '💀' },
    { key: 'DEAD', name: '已入土', icon: '⚰️' },
] as const;

export function arenaPercents(voteA: number, voteB: number): { a: number; b: number } {
    const total = (voteA || 0) + (voteB || 0);
    if (total === 0) {
        return { a: 50, b: 50 };
    }
    const a = Math.round((voteA / total) * 100);
    return { a, b: 100 - a };
}

export function pickRunningOrFirst<T extends { status: string }>(items: T[]): T | null {
    if (!items.length) {
        return null;
    }
    return items.find((item) => item.status === 'RUNNING') ?? items[0];
}

export function staleThermoClass(score: number): string {
    if (score >= 80) {
        return 'thermo-fire';
    }
    if (score >= 50) {
        return 'thermo-hot';
    }
    if (score >= 20) {
        return 'thermo-warm';
    }
    return 'thermo-cool';
}
