import type { SponsorPublicItem } from '@/apis/sponsor';

export function sponsorName({ maskedName, isMasked, isAnonymous }: SponsorPublicItem): string {
    const name = maskedName?.trim();
    if (isAnonymous === '1' || !name) return '热心水友';
    if (isMasked === '0' || name === '热心水友' || name.includes('*')) return name;
    if (name.length <= 2) return name.slice(0, -1) + '*';

    let hidden = 1;
    if (name.length > 10) hidden = 4;
    else if (name.length > 8) hidden = 3;
    else if (name.length > 6) hidden = 2;

    const start = Math.floor((name.length - hidden) / 2);
    return name.slice(0, start) + '*'.repeat(hidden) + name.slice(start + hidden);
}

export function sponsorTime(value: string): string {
    const match = value?.match(/^(?:\d{4}-)?(\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    return match ? match[1] + ' ' + match[2] : value;
}
