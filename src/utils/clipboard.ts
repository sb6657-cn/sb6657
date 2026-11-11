import { ElNotification } from 'element-plus';

export function copyError(err: unknown) {
    ElNotification({
        title: '复制失败',
        message: `复制操作失败，请稍后重试。
                可能你的浏览器不支持被动写入剪贴板，请换用其他浏览器`,
        type: 'error',
    });
    console.error('复制失败:', err);
}

export function copySuccess() {
    ElNotification({
        message: '复制成功',
        type: 'success',
    });
}
export function likeSuccess() {
    ElNotification({
        message: '点赞成功',
        type: 'success',
    });
}

function limitedCopy() {
    ElNotification({
        title: '请勿刷次数',
        message: '复制成功，但次数没有增加',
        type: 'warning',
    });
}
export function limitedLike() {
    ElNotification({
        title: '请勿刷次数',
        message: '点赞成功，但次数没有增加',
        type: 'warning',
    });
    return 'limitedSuccess';
}

export function copyToClipboard(copyText: string): boolean {
    const input = document.createElement('textarea');
    input.value = copyText;
    input.readOnly = true;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    try {
        input.select();
        if (!document.execCommand('copy')) throw new Error('浏览器未写入剪贴板');
        return true;
    } catch (error) {
        copyError(error);
        return false;
    } finally {
        input.remove();
    }
}

// 每个入口独立计时。返回 true 时，调用方才更新并上报复制次数。
export function createCountedCopy() {
    let nextCountAt = 0;
    return (text: string): boolean => {
        if (!copyToClipboard(text)) return false;
        const now = performance.now();
        if (now < nextCountAt) {
            limitedCopy();
            return false;
        }
        nextCountAt = now + 2000;
        copySuccess();
        return true;
    };
}
