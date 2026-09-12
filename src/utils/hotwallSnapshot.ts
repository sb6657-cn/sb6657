import httpInstance from '@/apis/httpInstance';
import { API } from '@/constants/backend';

export interface HotwallRankItem {
    barrageId: number;
    barrage: string;
    count: number;
}

function parseSseBlock(block: string): { eventName: string; dataStr: string } {
    let eventName = '';
    let dataStr = '';
    for (const line of block.split('\n')) {
        if (line.startsWith('event:')) {
            eventName = line.replace(/^event:\s*/, '').trim();
        } else if (line.startsWith('data:')) {
            dataStr += line.replace(/^data:\s?/, '');
        }
    }
    return { eventName, dataStr };
}

export async function fetchHotwallSnapshot(options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<HotwallRankItem[]> {
    const timeoutMs = options?.timeoutMs ?? 5000;
    const abort = new AbortController();
    const onParentAbort = () => abort.abort();
    options?.signal?.addEventListener('abort', onParentAbort);
    const timer = window.setTimeout(() => abort.abort(), timeoutMs);

    try {
        const token = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1] || '';
        const base = httpInstance.defaults.baseURL || '';
        const resp = await fetch(`${base}${API.HOTWALL_STREAM}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}`, dpahjdoiaw: 'eAR48ZFJwfRTy6SyQPFj' },
            signal: abort.signal,
        });
        if (!resp.ok || !resp.body) {
            return [];
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';
            for (const block of blocks) {
                if (!block.trim()) {
                    continue;
                }
                const { eventName, dataStr } = parseSseBlock(block);
                if (!dataStr || eventName !== 'snapshot') {
                    continue;
                }
                try {
                    const data = JSON.parse(dataStr) as { items?: HotwallRankItem[] };
                    return Array.isArray(data.items) ? data.items : [];
                } catch {
                    return [];
                }
            }
        }
        return [];
    } catch {
        return [];
    } finally {
        window.clearTimeout(timer);
        options?.signal?.removeEventListener('abort', onParentAbort);
        abort.abort();
    }
}
