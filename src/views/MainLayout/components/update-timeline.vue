<template>
    <div class="update-timeline">
        <h2 class="title">
            更新日志
            <span class="tips">(与源码 docs/更新日志.md 同步)</span>
        </h2>
        <el-timeline>
            <el-timeline-item v-for="group in parsedVersionGroups" :key="group.date" :timestamp="group.date" placement="top" type="success">
                <section v-for="version in group.versions" :key="version.version">
                    <h3>{{ version.version }}</h3>
                    <ul>
                        <li v-for="(item, index) in version.updates" :key="index" :class="getUpdateTypeClass(item.type)" class="update-content">
                            <strong>【{{ item.type }}】</strong>
                            <span class="content-text">{{ item.content }}</span>
                        </li>
                    </ul>
                </section>
            </el-timeline-item>
        </el-timeline>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import updateMd from '/docs/更新日志.md?raw';
import { ElTimeline, ElTimelineItem } from 'element-plus';

interface UpdateItem {
    type: string;
    content: string;
}

interface VersionInfo {
    version: string;
    date: string;
    updates: UpdateItem[];
}

interface VersionGroup {
    date: string;
    versions: VersionInfo[];
}

// 将新旧版本号中的日期转换为时间线日期
function convertVersionToDate(versionStr: string): string {
    const currentMatch = versionStr.match(/[.+](\d{4})(\d{2})(\d{2})$/);
    if (currentMatch) {
        const [, year, month, day] = currentMatch;
        return `${year}-${month}-${day}`;
    }

    const legacyMatch = versionStr.match(/^(\d{2})\.(\d{1,2})\.(\d{1,2})$/);
    if (legacyMatch) {
        const [, year, month, day] = legacyMatch;
        const fullYear = `20${year}`;
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        return `${fullYear}-${paddedMonth}-${paddedDay}`;
    }

    return versionStr;
}

function formatVersionTitle(versionStr: string): string {
    const currentMatch = versionStr.match(/^(V\d+\.\d+\.\d+)[.+]\d{8}$/);
    const displayVersion = currentMatch ? currentMatch[1] : versionStr;
    return `版本【${displayVersion}】`;
}

// 解析更新日志 Markdown 字符串
function parseUpdateLog(): VersionInfo[] {
    const versions: VersionInfo[] = [];

    // 按版本分割
    const versionBlocks = updateMd.split(/## 版本【/).filter((block) => block.trim());

    versionBlocks.forEach((block) => {
        const lines = block.trim().split('\n');
        if (lines.length === 0) return;

        // 提取版本号
        const versionMatch = lines[0].match(/^([^】]+)】/);
        if (!versionMatch) return;

        const versionNumber = versionMatch[1];
        const version = formatVersionTitle(versionNumber);
        const date = convertVersionToDate(versionNumber);
        const updates: UpdateItem[] = [];

        // 解析更新项
        let currentUpdate: UpdateItem | null = null;

        lines.slice(1).forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;

            // 匹配格式：数字、【类型】内容
            const updateMatch = trimmedLine.match(/^\d+、【([^】]*)】(.*)$/);
            if (updateMatch) {
                // 如果有之前的更新项，先保存
                if (currentUpdate) {
                    updates.push(currentUpdate);
                }

                let type = updateMatch[1].trim();
                let content = updateMatch[2].trim();

                // 处理空类型或只有空格的类型
                if (!type) {
                    type = '其他';
                }

                // 创建新的更新项
                currentUpdate = {
                    type,
                    content,
                };
            } else if (trimmedLine.match(/^\d+、/)) {
                // 匹配没有类型标记的更新项：数字、内容
                if (currentUpdate) {
                    updates.push(currentUpdate);
                }

                const cleanContent = trimmedLine.replace(/^\d+、/, '').trim();
                if (cleanContent) {
                    currentUpdate = {
                        type: '其他',
                        content: cleanContent,
                    };
                }
            } else if (currentUpdate && (line.startsWith('\t') || line.startsWith('​') || line.match(/^\s{2,}/))) {
                // 处理缩进的多行内容，合并到当前更新项
                currentUpdate.content += '\n' + trimmedLine;
            } else if (trimmedLine && !trimmedLine.startsWith('##')) {
                // 其他非空行，如果没有当前更新项就创建一个
                if (!currentUpdate) {
                    currentUpdate = {
                        type: '其他',
                        content: trimmedLine,
                    };
                } else {
                    // 如果有当前更新项，追加到内容中
                    currentUpdate.content += '\n' + trimmedLine;
                }
            }
        });

        // 保存最后一个更新项
        const lastUpdate = currentUpdate as UpdateItem | null;
        if (lastUpdate && lastUpdate.content.trim()) {
            updates.push(lastUpdate);
        }

        if (updates.length > 0) {
            versions.push({ version, date, updates });
        }
    });

    // 倒序排列，最新版本在最上面
    return versions.reverse();
}

function groupVersionsByDate(versions: VersionInfo[]): VersionGroup[] {
    const groups = new Map<string, VersionInfo[]>();

    versions.forEach((version) => {
        const sameDayVersions = groups.get(version.date) ?? [];
        sameDayVersions.push(version);
        groups.set(version.date, sameDayVersions);
    });

    return Array.from(groups, ([date, groupedVersions]) => ({
        date,
        versions: groupedVersions,
    }));
}

// 静态解析结果
const parsedVersionGroups = ref<VersionGroup[]>(groupVersionsByDate(parseUpdateLog()));

const updateTypeClassMap: Record<string, string> = {
    新增: 'update-type-add',
    修复: 'update-type-fix',
    优化: 'update-type-optimize',
    删除: 'update-type-delete',
    删改: 'update-type-delete',
    重构: 'update-type-refactor',
    修改: 'update-type-change',
    调整: 'update-type-adjust',
    更新: 'update-type-update',
    调研: 'update-type-research',
    破费: 'update-type-cost',
    警告: 'update-type-warning',
    前端基建: 'update-type-infra',
    重启: 'update-type-restart',
};

// 根据更新类型返回对应的CSS类
function getUpdateTypeClass(type: string): string {
    return updateTypeClassMap[type] || 'update-type-other';
}
</script>

<style lang="scss" scoped>
.update-timeline {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    background-color: var(--card-bg);
    .title {
        margin-bottom: 16px;
        font-size: 20px;
        color: var(--body-color);
        .tips {
            font-weight: normal;
            font-size: 12px;
            color: gray;
            font-style: italic;
        }
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin-bottom: 6px;
        font-size: 14px;
        color: #606266;

        html.dark & {
            color: var(--el-text-color-regular);
        }

        strong {
            margin-right: 6px;
        }

        .content-text {
            white-space: pre-line;
            line-height: 1.6;
        }
    }

    // 不同类型的颜色标识
    .update-type-add strong {
        color: #42b983;
    }
    .update-type-fix strong {
        color: #f39c12;
    }
    .update-type-optimize strong {
        color: #3498db;
    }
    .update-type-delete strong {
        color: #e74c3c;
    }
    .update-type-refactor strong {
        color: #9b59b6;
    }
    .update-type-change strong {
        color: #e67e22;
    }
    .update-type-adjust strong {
        color: #f1c40f;
    }
    .update-type-update strong {
        color: #00a8c6;
    }
    .update-type-research strong {
        color: #16a085;
    }
    .update-type-cost strong {
        color: #d35400;
    }
    .update-type-warning strong {
        color: #c0392b;
    }
    .update-type-infra strong {
        color: #5c6bc0;
    }
    .update-type-restart strong {
        color: #2ecc71;
    }
    .update-type-other strong {
        color: #95a5a6;
    }
}

// 移动端适配
@media (max-width: 600px) {
    .update-timeline {
        padding: 15px;
        li {
            font-size: 13px;
        }
    }
}
</style>
