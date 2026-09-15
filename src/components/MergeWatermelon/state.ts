import { ref } from 'vue';

/**
 * 全局合成流心西瓜游戏弹窗可见性。
 * 由 MergeWatermelonLauncher 写入，由 MergeWatermelonDialog 读取。
 */
export const mergeWatermelonDialogVisible = ref(false);
