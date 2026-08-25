// 优先从环境变量读取后端地址，未设置时回退默认值
export const SERVER_ADDRESS = (import.meta.env.VITE_BASE_URL as string) || 'https://hguofichp.cn:10086';

export const API = {
    INCREASE_COPY_COUNT: '/machine/addCnt',             // 增加复制次数
    INCREASE_LIKE_COUNT: '/machine/like',               // 增加复制次数
    GET_HOT_MEME_24h: '/machine/hotBarrageOf24H',       // 获取24小时热门烂梗
    GET_HOT_MEME_7D: '/machine/hotBarrageOf7Day',       // 获取7天热门烂梗
    SEARCH_MEME: '/machine/pageSearch',                 // 根据关键词搜索烂梗
    GET_ALL_MEME: '/machine/Page?',                     // 获取全部烂梗分页
    GET_SORTED_ALL_MEME: '/machine/sortAllBarrage',     // 获取排序后的全部烂梗
    GET_FK_WJQ_MEME: '/machine/Page?tags=00',           // 获取喷玩机器篇烂梗
    GET_FK_PLAYER_MEME: '/machine/Page?tags=01',        // 获取喷选手篇烂梗
    GET_P1_MEME: '/machine/Page?tags=02',               // 获取加一篇烂梗
    GET_MYGO_MEME: '/machine/Page?tags=05',             // 获取木柜子篇烂梗
    GET_FK_EACHOTHER_MEME: '/machine/Page?tags=09',     // 获取直播间互喷篇烂梗
    GET_QUQU_MEME: '/machine/Page?tags=03',             // 获取QUQU篇烂梗
    GET_SHOWTIME_MEME: '/machine/Page?tags=06',         // 获取群魔乱舞篇烂梗
    GET_RAND_ONE_MEME: '/machine/getRandOne',           // 随机一条烂梗
    SUBMIT_MEME: '/machine/submission',                 // 烂梗投稿
    GET_MEME_TAGS: '/machine/dictList',                 // 获取烂梗标签
    GET_SHIELD_WORD: '/machine/getShieldWordDict',      // 获取屏蔽词字典
    GET_MY_SHIELD_WORD_LIST: '/machine/getMyShieldWordList', // 获取我投稿的屏蔽词列表

    // ===== 新功能：用户成长 / 玩法 =====
    GROWTH_ME: '/machine/growth/me',                       // 我的成长信息
    GROWTH_RANK: '/machine/growth/rank',                   // 经验排行榜
    GROWTH_MEDALS: '/machine/growth/medals',               // 勋章墙
    STALE_VOTE: '/machine/stale/vote',                     // 烂度投票
    STALE_RANK: '/machine/stale/rank',                     // 烂度榜
    STALE_HOT: '/machine/stale/hot',                       // 烂度热榜
    ARENA_CURRENT: '/machine/arena/current',               // 今天PK + 本周排行
    ARENA_VOTE: '/machine/arena/vote',                     // 擂台投票
    ARENA_WEEKLY: '/machine/arena/weekly',                 // 所有历史周排行列表
    ARENA_WEEKLY_DETAIL: '/machine/arena/weekly/',         // 指定周排行详情 (后接 /{weekStart})
    CHECKIN_SIGN: '/machine/checkin/sign',                 // 签到
    CHECKIN_STATUS: '/machine/checkin/status',             // 签到状态
    CHECKIN_WALLET: '/machine/checkin/wallet',             // 我的钱包
    CHECKIN_REWARD: '/machine/checkin/reward',             // 打赏
    WHOAMI: '/machine/whoami',                              // 登录状态查询（前端用于校准 token 是否仍有效）
    LIFECYCLE_DASHBOARD: '/machine/lifecycle/dashboard',   // 生命周期看板
    LIFECYCLE_STAGE: '/machine/lifecycle/stage',           // 生命周期分阶段分页 (后接 /{stage}?pageNum=&pageSize=)
    DNA_RELATIONS: '/machine/dna',                         // 梗DNA关联 (后接 /{barrageId})
    DNA_RELATIONS_V6: '/machine/dna/v6',                   // 模板优先的梗DNA v6 (后接 /{barrageId})
    HOTWALL_STREAM: '/machine/hotwall/stream',             // 实时热度墙 SSE
} as const;

import all_icon from '@/assets/icons/all_icon.svg';
import chat_icon from '@/assets/icons/chat_icon.svg';
import cs2_icon from '@/assets/icons/cs2_icon.svg';
import deja_vu_niko from '@/assets/icons/deja_vu_niko.svg';
import home_icon from '@/assets/icons/home_icon.svg';
import image_icon from '@/assets/icons/image_icon.svg';
import post_icon from '@/assets/icons/post-bar.svg';
import shieldWord from '@/assets/icons/shield_word.svg';
import donk from '@/assets/imgs/donk.png';
import stale_icon from '@/assets/icons/stale_icon.svg';
import arena_icon from '@/assets/icons/arena_icon.svg';
import lifecycle_icon from '@/assets/icons/lifecycle_icon.svg';
import hotwall_icon from '@/assets/icons/hotwall_icon.svg';

export const MemeCategory = [
    { path: '/home', text: '首页', icon: home_icon },
    { path: '/memes/AllBarrage', text: '全部烂梗', icon: all_icon, api: API.GET_ALL_MEME, category: 'allbarrage' },
    { path: '/image', text: '时光相册', icon: image_icon },
    { path: '/post-bar', text: '社区贴吧', icon: post_icon },
    { path: '/aichat', text: 'AI造梗', icon: chat_icon },
    { path: '/shieldWord', text: '屏蔽词收集', icon: shieldWord },
    { path: '/15warriorsDonk', text: '布雷德15勇士', icon: donk },
    { path: '/matchLib', text: '赛事烂梗库', icon: cs2_icon },
    { path: '/matchPrediction', text: '赛事竞猜', icon: cs2_icon },
    { path: '/dejaVuNiko', text: '超级逮虾户战报', icon: deja_vu_niko },
    { path: '/stale', text: '烂度热榜', icon: stale_icon },
    { path: '/arena', text: '烂梗擂台', icon: arena_icon },
    { path: '/lifecycle', text: '梗生命周期', icon: lifecycle_icon },
    { path: '/hotwall', text: '实时热度墙', icon: hotwall_icon },
];
