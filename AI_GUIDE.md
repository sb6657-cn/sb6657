# AI_GUIDE.md

这份文档给接手项目的人和 AI 助手用。重点不是“开发流程”，而是这个前端项目真正依赖的东西：

- 前端调了哪些后端接口
- 页面和组件怎么嵌套
- UI 布局在桌面端和移动端分别怎么排
- 后续改代码时最容易踩到哪里

## 项目定位

这是 `sb6657.cn` 的 Vue 前端。项目核心不是复杂前端状态机，而是：

1. 从后端接口拿烂梗、标签、屏蔽词、帖子、赛事、成长/梗币、实时热点、排行榜和 AI 会话等数据。
2. 用 Element Plus、ECharts 和 Matter.js 完成列表、弹窗、图谱与小游戏交互。
3. 在桌面端和移动端做两套偏不同的布局。

技术栈：

| 类别      | 使用                                                    |
| --------- | ------------------------------------------------------- |
| 框架      | Vue 3、Vue Router、Pinia                                |
| UI        | Element Plus、Element Plus Icons                        |
| 样式      | SCSS、组件内 scoped 样式、少量全局 CSS                  |
| 图表/画布 | ECharts、ECharts wordcloud、Three.js、Matter.js、html2canvas、html-to-image |
| 请求/长连接 | Axios 封装、原生 `fetch` 流、WebSocket                |

## 版本策略

项目自 `V3.13.11.20260721` 起采用 `Vmajor.minor.patch.yyyymmdd` 展示版本，第三版网站的历史 minor 溯源、升级边界和发布同步清单统一维护在 `docs/版本策略.md`。

- 页面右下角、源码更新日志标题和 `sbVersion` 使用完整格式，例如 `V3.13.11.20260721`。
- `package.json` 受 SemVer 约束，使用等价的 `3.13.11+20260721`；`pnpm-lock.yaml` 不记录根包发布版本。
- 旧的 `YY.MM.DD` 更新日志标题仅作历史记录，不批量改写。
- 页面右下角直接显示完整版本；C 端更新日志时间线按发布日期合并节点，同日多个版本在节点内按新到旧展示，新版本标题只显示 `版本【Vmajor.minor.patch】`。
- 后续代码改动不能只按日期覆盖版本，也不能只看 `feat` 判断 minor；必须先按版本策略确定 major、minor 或 patch。

## 部署和 CI

项目从个人仓库迁移到 `sb6657-cn` 组织后，部署链路如下：

```text
sb6657-cn/sb6657（源码仓库）
└─ GitHub Actions 构建 dist
   └─ GitHub App 临时令牌（约 1 小时有效）
      └─ push 到 sb6657-cn/sb6657-cn.github.io（部署仓库，main 根目录）
         └─ GitHub Pages 发布到 sb6657.cn（Custom Domain 由部署仓库 CNAME 维护）
```

- `.github/workflows/action.yml` 在 push main/master（Markdown-only 改动忽略）或手动触发时，依次执行 `pnpm install --frozen-lockfile`、lint、typecheck、build。
- 构建完成后用 `actions/create-github-app-token` 生成临时 installation token：Client ID 在 Actions Variable `PAGES_APP_CLIENT_ID`，私钥在 Secret `PAGES_APP_PRIVATE_KEY`；token 只授予 `sb6657-cn/sb6657-cn.github.io` 的 Contents write，不再使用旧个人 PAT `ACCESS_TOKEN`。
- 部署时只删部署仓库的 `assets/`，再用 dist 整体覆盖，保留 CNAME、404.html、README 等手工维护文件；提交以 App 的 `xxx[bot]` 身份完成，产物无变化时跳过提交。
- 组织下其他旧版站点仓库（`v1.sb6657.cn`、`v2.sb6657.cn` 等）经各自 gh-pages 分支发布，地址为 `sb6657.cn/<仓库名>/`；首页时光机和 Footer 的旧版入口指向这些地址。
- `sb6657oss.wishao.fun` 是独立 OSS 静态资源域名（榜单 JSON、占位图等），不属于 GitHub Pages，迁移后保持不变。

## 请求层和后端地址

后端地址定义在 `src/constants/backend.ts`：

```ts
export const SERVER_ADDRESS = import.meta.env.VITE_BASE_URL || 'https://hguofichp.cn:10086';
```

统一请求实例在 `src/apis/httpInstance.ts`：

- `baseURL` 使用 `SERVER_ADDRESS`。
- 请求头会自动带：
    - `siteToken`：匿名统计用，存 cookie。
    - `dpahjdoiaw`：Web 前端来源统计标记，用来告诉后端“这次请求来自 sb6657.cn 官网前端”。
    - `Authorization: Bearer ${token}`：登录后带。
- `dpahjdoiaw` 不是鉴权密钥，也不是反爬安全边界。QQ bot、agent、油猴插件或第三方脚本如果复用网站后端接口，不要复制这个请求头，否则会把外部调用统计到官网前端来源里。
- 响应拦截器会把 AxiosResponse 解成后端返回体，所以组件里 `await httpInstance.get(...)` 得到的是 `{ code, data, msg }` 这一层，不是 Axios 原始响应。
- `httpInstance.get<T>`、`post<T>` 等实例方法的泛型 `T` 表示 `data` 字段类型；默认是 `unknown`，需要读取 `data` 的调用应声明对应业务类型。
- Token 即将过期时会用 `/refresh-token` 刷新，并把刷新期间的请求放进队列。
- 登录页的“15天内自动登录”控制 token 存储位置：勾选后存 `localStorage`，未勾选只存当前浏览器会话的 `sessionStorage`；业务代码统一通过 `cookieUtils.getToken()` 取登录态。
- 401 会弹登录框；500/601/其他错误会走 Element Plus 消息提示。

另外 `httpInstance.ts` 还导出了两个轻封装：

| 函数                        | 返回                     |
| --------------------------- | ------------------------ |
| `get<R>(url)`               | `{ _failure, flatData }` |
| `post<T, R>({ url, data })` | `{ _failure, flatData }` |

目前只有部分 API 使用这两个封装，很多组件还是直接 `httpInstance.get/post`。

长连接和流式响应是例外：AI 造梗与实时热度墙都使用原生 `fetch` 读取响应流；“合成大猪头”的排行榜仍走上述 `get()`，但对局状态使用原生 WebSocket。

## 后端接口清单

下面按业务域列出前端实际调用过的接口。路径来自当前代码扫描，不只来自 `API` 常量。

### 登录、注册、用户

| 方法 | 路径                             | 调用位置                            | 用途                            |
| ---- | -------------------------------- | ----------------------------------- | ------------------------------- |
| GET  | `/captchaImage`                  | `login.vue`、`register.vue`         | 获取图片验证码和 uuid           |
| POST | `/login`                         | `login.vue`                         | 登录，返回 token / refreshToken |
| POST | `/refresh-token`                 | `httpInstance.ts`                   | 刷新登录 token                  |
| GET  | `/login/getMailCode`             | `register.vue`、`resetPassword.vue` | 发送邮箱验证码                  |
| POST | `/register`                      | `register.vue`                      | 注册                            |
| POST | `/resetPassword`                 | `resetPassword.vue`                 | 未登录时重置密码                |
| GET  | `/system/user/profile`           | `user/components/index.vue`         | 获取当前用户资料                |
| PUT  | `/system/user/profile`           | `user/components/userInfo.vue`      | 修改昵称，并更新剩余改名次数    |
| PUT  | `/system/user/profile/updatePwd` | `user/components/resetPwd.vue`      | 已登录用户修改密码              |

### 烂梗、标签、投稿、搜索

| 方法 | 路径                                  | 调用位置                                            | 用途                                       |
| ---- | ------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| GET  | `/machine/dictList`                   | `memeTags` store                                    | 获取烂梗标签字典                           |
| GET  | `/machine/Page?`                      | `getMemeList()`、`memes-view.vue`、`didYouKnow.vue` | 分页获取烂梗，常带 `tags/pageNum/pageSize` |
| GET  | `/machine/sortAllBarrage`             | `getMemeListByCopyCount()`、`memes-view.vue`        | 全部烂梗按复制次数从高到低排序             |
| POST | `/machine/pageSearch`                 | `search-dialog.vue`、`sendPost.vue`                 | 搜索烂梗，支持关键词、标签、时间、排序     |
| GET  | `/machine/hotBarrageOf24H`            | `hot-meme-dialogs.vue`                              | 24 小时热门                                |
| GET  | `/machine/hotBarrageOf7Day`           | `hot-meme-dialogs.vue`                              | 7 天热门                                   |
| GET  | `/machine/getRandOne`                 | `random-meme.vue`                                   | 首页随机一条烂梗                           |
| POST | `/machine/submission`                 | `meme-submission.vue`、`setMeme.ts`                 | 投稿烂梗，可带 `tags/barrage/matchId`      |
| GET  | `/machine/addCnt/{memeId}`            | 多处复制按钮                                        | 复制次数 +1                                |
| GET  | `/machine/getBarrageInfo/{barrageId}` | 帖子列表                                            | 根据烂梗 ID 获取烂梗内容                   |
| GET  | `/machine/MeMemesPageList`            | `Me-memes.vue`                                      | 我的烂梗投稿                               |
| GET  | `/machine/InProgressMatch`            | `meme-submission.vue`                               | 获取当前进行中的大型赛事，用于投稿关联赛事 |
| GET  | `/machine/WordCloud`                  | `wordCloud.vue`                                     | 搜索词云数据                               |

`API` 常量里还保留了若干分类路径，例如 `GET_FK_WJQ_MEME`、`GET_QUQU_MEME`，现在主要靠 `/machine/Page?` 加 `tags` 参数实现分类。

### 屏蔽词

| 方法 | 路径                           | 调用位置          | 用途                                     |
| ---- | ------------------------------ | ----------------- | ---------------------------------------- |
| GET  | `/machine/getShieldWordDict`   | `shieldWordStore` | 获取已生效屏蔽词字典，列表页用来标记烂梗 |
| GET  | `/machine/getShieldWordList`   | `shieldWord.vue`  | 屏蔽词投票列表                           |
| GET  | `/machine/addIsShieldWord`     | `shieldWord.vue`  | 投票“这是屏蔽词”，参数 `id`              |
| GET  | `/machine/addNotShieldWord`    | `shieldWord.vue`  | 投票“这不是屏蔽词”，参数 `id`            |
| GET  | `/machine/addShieldWord`       | `shieldWord.vue`  | 投稿屏蔽词，参数 `shieldWord`            |
| GET  | `/machine/getMyShieldWordList` | `shieldWord.vue`  | 我投稿的屏蔽词列表                       |

### 帖子、评论、消息

| 方法 | 路径                                        | 调用位置                             | 用途                             |
| ---- | ------------------------------------------- | ------------------------------------ | -------------------------------- |
| GET  | `/machine/Post/list`                        | `post-bar-main.vue`                  | 社区帖子列表                     |
| GET  | `/machine/Post/selectIsMePageList`          | `Me-Post.vue`                        | 我的帖子列表                     |
| POST | `/machine/Post/ReviewPost/submit`           | `sendPost.vue`                       | 发帖投稿，进入审核               |
| POST | `/machine/Post/like/{postId}`               | `post-bar-main.vue`、`Me-Post.vue`   | 点赞帖子                         |
| POST | `/machine/Post/Statement`                   | `post-bar-main.vue`、`Me-Post.vue`   | 给帖子发表态，`statementNum` 0-8 |
| GET  | `/machine/Post/Comment/getComment/{postId}` | `CommentList.vue`、帖子列表          | 获取帖子评论                     |
| POST | `/machine/Post/Comment/add`                 | `CommentList.vue`                    | 新增评论                         |
| POST | `/machine/Post/Comment/like/{commentId}`    | `CommentList.vue`、`CommentItem.vue` | 点赞评论                         |
| POST | `/machine/Post/Comment/reply`               | `CommentList.vue`、`CommentItem.vue` | 回复评论                         |
| GET  | `/machine/SysMessage/getMsgNum`             | `header-message-entry.vue`           | 顶部消息未读数                   |
| GET  | `/machine/SysMessage/getLikeMsgList`        | `Post-Message.vue`                   | 我的消息列表                     |

### 赛事竞猜、赛事烂梗库

| 方法 | 路径                               | 调用位置                                          | 用途                                                |
| ---- | ---------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| GET  | `/machine/matches`                 | `CS2Major.vue`                                    | 当前 Major 赛事和阶段配置                           |
| GET  | `/machine/matches/{matchId}/teams` | `match.ts`、`MajorPhase.vue`、`MajorChampion.vue` | 获取某赛事某阶段队伍，参数 `phase`                  |
| POST | `/machine/prediction/submit`       | `match.ts`                                        | 保存预测                                            |
| GET  | `/machine/prediction/records`      | `match.ts`                                        | 获取当前用户预测记录，参数 `matchId/phase`          |
| GET  | `/machine/shareMatch`              | `CS2Major.vue`                                    | 分享截图后统计                                      |
| GET  | `/machine/matchCoin`               | `CS2Major.vue`                                    | 预览 3D 硬币后统计                                  |
| GET  | `/machine/getMatchList`            | `matchLib.vue`                                    | 赛事库列表                                          |
| GET  | `/machine/matchPageList`           | `matchLib.vue`                                    | 某赛事关联烂梗列表，参数 `matchId/pageNum/pageSize` |

### 年度 TOP20

| 方法 | 路径                          | 调用位置            | 用途                         |
| ---- | ----------------------------- | ------------------- | ---------------------------- |
| POST | `/machine/hotTop20/pick`      | `AnnualHotList.vue` | TOP20 提名/投票              |
| POST | `/machine/hotTop20/Query`     | `AnnualHotList.vue` | TOP20 活动内搜索候选烂梗     |
| GET  | `/machine/hotTop20/loadTop20` | `AnnualHotList.vue` | 加载提名榜、阶段榜或最终结果 |
| GET  | `/machine/hotTop20/pickSum`   | `AnnualHotList.vue` | 总提名数                     |

另一个展示页 `memeTop20.vue` 不走后端，直接读 OSS JSON：

| 方法 | URL                                                | 用途            |
| ---- | -------------------------------------------------- | --------------- |
| GET  | `https://sb6657oss.wishao.fun/memeTop20_2025.json` | 2025 TOP20 展示 |
| GET  | `https://sb6657oss.wishao.fun/memeTop20_2024.json` | 2024 TOP20 展示 |

### AI 造梗

| 方法   | 路径                                | 调用位置     | 用途              |
| ------ | ----------------------------------- | ------------ | ----------------- |
| GET    | `/ai/sessions`                      | `AIChat.vue` | 会话列表          |
| GET    | `/ai/sessions/{sessionId}/messages` | `AIChat.vue` | 某会话消息        |
| DELETE | `/ai/sessions/{sessionId}`          | `AIChat.vue` | 删除会话          |
| POST   | `/ai/chat/stream`                   | `AIChat.vue` | SSE 流式聊天/造梗 |
| GET    | `/ai/daily-remaining`               | `AIChat.vue` | 今日剩余次数      |

`/ai/chat/stream` 使用原生 `fetch`，不是 `httpInstance`，手动带 `Authorization`。请求体大致是：

```json
{
    "prompt": "用户输入",
    "needReasoning": true,
    "sessionId": 123,
    "enableWebSearch": true,
    "skill": "MEME_MAKER",
    "mode": "MEME"
}
```

### 用户成长、烂度、擂台和梗币

| 方法 | 路径                                      | 调用位置       | 用途 / 参数                                              |
| ---- | ----------------------------------------- | -------------- | -------------------------------------------------------- |
| GET  | `/machine/growth/me`                      | `growth.vue`   | 当前用户经验、段位、投稿数、上榜数和全站排名             |
| GET  | `/machine/growth/medals`                  | `growth.vue`   | 勋章全集与当前用户已拥有的勋章 code                      |
| GET  | `/machine/growth/rank`                    | `growth.vue`   | 经验排行榜                                               |
| GET  | `/machine/stale/rank?pageNum=&pageSize=`  | `stale.vue`、`home-plaza.vue` | 烂度总榜；首页预览只拉 1 条                             |
| GET  | `/machine/stale/hot?pageNum=&pageSize=`   | `stale.vue`    | 实时热度榜，展示 `hotScore`                              |
| POST | `/machine/stale/vote`                     | `stale.vue`    | 烂度投票，body 为 `{ barrageId, score }`                 |
| GET  | `/machine/arena/current`                  | `arena.vue`、`home-plaza.vue` | 今日对决、日期范围和本周排行；首页只预览一组 PK         |
| POST | `/machine/arena/vote`                     | `arena.vue`    | 对决投票，body 为 `{ matchId, choice }`                  |
| GET  | `/machine/arena/weekly`                   | `arena.vue`    | 历史周排行索引                                           |
| GET  | `/machine/arena/weekly/{weekStart}`       | `arena.vue`    | 展开某周时按需加载排行详情                               |
| GET  | `/machine/checkin/status`                 | `checkin.vue`、`home-checkin-strip.vue` | 今日签到状态和连续签到天数；首页未登录不请求 |
| GET  | `/machine/checkin/wallet`                 | `checkin.vue`、`growth.vue` | 梗币余额、累计获得和累计花费                  |
| POST | `/machine/checkin/sign`                   | `checkin.vue`  | 每日签到，body 为空对象                                  |
| POST | `/machine/checkin/reward`                 | `checkin.vue`  | 打赏烂梗，body 为 `{ barrageId, amount }`                |

成长和梗币是用户维度数据。入口主要在右上角用户下拉菜单，`growth.vue` 还会读取钱包余额；`checkin.vue` 复用 `/machine/pageSearch` 做远程烂梗搜索，再提交打赏。页面本身没有单独维护登录弹窗，鉴权失败继续交给全局请求拦截器处理。

这些数值都由后端结算，前端不要重复实现规则。当前页面文案与更新日志记录的用户可见规则包括：投稿过审、上热榜和投稿被复制会获得经验；每满 100 次复制会给投稿者 1 梗币；签到基础奖励与连续签到加成都由签到接口返回。勋章 code 也由后端决定，前端当前只负责为已知 code 映射图标和解锁态。

### 生命周期、DNA 和实时热度墙

| 方法 | 路径                                                    | 调用位置                    | 用途                                                     |
| ---- | ------------------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| GET  | `/machine/lifecycle/dashboard`                          | `lifecycle.vue`、`home-plaza.vue` | 四个生命周期阶段的数量统计                         |
| GET  | `/machine/lifecycle/stage/{stage}?pageNum=&pageSize=20` | `lifecycle.vue`             | `BIRTH/BOOM/STALE/DEAD` 各阶段独立分页                   |
| GET  | `/machine/dna/v6/{memeId}`                              | `memeDnaV6.ts`、`lifecycle.vue` | 获取中心梗、节点和带评分明细的关系边                  |
| GET  | `/machine/dna/v6/{memeId}/evolution`                    | `memeDnaV6.ts`              | 获取母体和衍生链；封装已存在，但当前页面调用被注释       |
| GET  | `/machine/hotwall/stream`                               | `hotwall.vue`、`home-now-strip.vue` | SSE 实时事件流与最近 5 分钟热度快照；首页只取一帧 snapshot 后断开 |

DNA v6 的节点包含标准化文本、固定片段、可变槽位、关键词、锚点、结构模板、语义骨架和指纹。关系类型固定为 `DERIVED_FROM`、`PARENT_OF`、`SAME_TEMPLATE`、`VARIANT_OF`、`HIGHLY_SIMILAR`；每条边还带模板、结构、固定片段和槽位模式等分项得分。`API.DNA_RELATIONS` 仍保留旧 `/machine/dna` 常量，但当前图谱走 `DNA_RELATIONS_V6`。

热度墙没有使用 `EventSource`，而是用原生 `fetch` 携带认证头后手工解析 SSE：`snapshot` 事件整体替换排行榜，`event` 事件加入实时流，前端最多保留 40 条。连接失败或读取抛错时会在 3 秒后重连；流正常返回 EOF 时当前代码只会标记断开，不会主动安排重连。提交标题中提到的“直播间自动数采”是后端职责，前端这里只消费后端推送，不负责采集斗鱼数据。

### 合成大猪头

| 协议 | 路径                                                  | 调用位置                      | 用途                                  |
| ---- | ----------------------------------------------------- | ----------------------------- | ------------------------------------- |
| GET  | `/machine/merge-pig/leaderboard?top={top}`            | `apis/mergePig.ts`            | 排行榜，弹窗当前请求 TOP100           |
| GET  | `/machine/merge-pig/rank/{siteToken}`                 | `apis/mergePig.ts`            | 当前匿名站点标识的历史最高分和排名    |
| WSS  | `wss://hguofichp.cn:10086/machine/merge-pig/{siteToken}` | `MergePig/native/wsClient.js` | 初始化球序列、上报对局并接收结算       |

WebSocket 消息约定来自当前前端：

| 方向       | `type`         | 主要字段                                   |
| ---------- | -------------- | ------------------------------------------ |
| 服务端 → 前端 | `init`       | `queue`、`bestScore`                       |
| 服务端 → 前端 | `next`       | `level`、`score`                           |
| 服务端 → 前端 | `game_over`  | `win`、`score`、`rank`                     |
| 前端 → 服务端 | `drop`       | `score`                                    |
| 前端 → 服务端 | `score_update` | `score`、`level`、可选 `adminToken`；每 20 秒上报 |
| 前端 → 服务端 | `game_over`  | `win`、`score`、`level`、可选 `adminToken` |
| 前端 → 服务端 | `restart`    | 无额外字段                                 |

`siteToken` 从 cookie 读取；没有时弹窗本次会退回临时的 `anonymous-{timestamp}`。登录态下，WebSocket 的定时分数和结算消息会尝试附带 `localStorage` 中的 `Admin-Token`，用于让后端关联昵称。REST 请求仍沿用 `httpInstance` 的后端地址，但 WebSocket 地址目前是独立硬编码的。

### 相册、外部数据和其他接口

| 方法 | 路径 / URL                                                 | 调用位置             | 用途                  |
| ---- | ---------------------------------------------------------- | -------------------- | --------------------- |
| GET  | `/machine/showImage`                                       | `image.vue`、`home-plaza.vue` | 主播相册分页；首页预览最新一张 |
| POST | `/machine/addCommentname`                                  | `image.vue`          | 图片评论              |
| GET  | `https://sb6657oss.wishao.fun/dejaVuNiko.json`             | `deja-vu-niko.vue`   | 超级逮虾户战报数据    |
| GET  | `https://sb6657oss.wishao.fun/15warriorsDonk_2025.json`    | `15warriorsDonk.vue` | 2025 布雷德十五勇士榜 |
| GET  | `https://sb6657oss.wishao.fun/15warriorsDonk_2026.json`    | `15warriorsDonk.vue` | 2026 布雷德十五勇士榜 |
| POST | `https://easycomment.ai/api/xhs/v1/detect-sensitive-words` | `ChatRoom.vue`       | 敏感词检测实验接口    |

## 全局组件树

```text
App.vue
├─ RouterView
│  └─ MainLayout.vue
│     ├─ HeaderBar（仅负责双端切换）
│     │  ├─ DesktopHeader / MobileHeader
│     │  ├─ HeaderSearch -> 路由 search 查询
│     │  ├─ HotMemeDialogs -> meme-dialog.vue
│     │  ├─ HeaderSubmissionEntry -> useSubmissionDialogStore
│     │  ├─ HeaderMessageEntry
│     │  ├─ HeaderSupportEntry / HeaderBusinessEntry
│     │  ├─ ThemeSwitcher -> themeStore
│     │  └─ 用户入口 -> userHome.vue -> login/register/resetPassword
│     ├─ MobileTopTabs（移动端横向 Tab 导航）
│     ├─ DesktopSidebar（桌面端左侧菜单）
│     ├─ RouterView 页面内容
│     ├─ GlobalDialogHost（全局单例弹窗宿主）
│     │  ├─ SearchDialogHost -> search-dialog.vue
│     │  └─ submission-dialog.vue -> meme-submission.vue
│     ├─ FooterBar
│     ├─ FloatingSidebar
│     │  ├─ 首页桌面端词云 HomeWordCloudPanel -> wordCloud.vue
│     │  ├─ 桌面端可拖拽 ChatRoom
│     │  ├─ 官方交流群竖向按钮
│     │  └─ 赞助/广告入口
│     └─ 直播间贵宾数 GuiBin
├─ Starrysky.vue
├─ IdleScreensaver.vue
├─ AnnouncementDialog.vue
├─ MergePigLauncher.vue -> mergePigDialogVisible
└─ MergePigDialog.vue
   ├─ MergeMilkFrogGame（Matter.js 游戏实例）
   ├─ MergePigWsClient（服务端球序列与分数上报）
   └─ TOP100 / 我的排名
```

说明：

- `Starrysky.vue` 是全局背景，不负责业务浮窗。
- `FloatingSidebar.vue` 是全局浮窗、右侧栏、桌面首页词云的入口。
- `MainLayout.vue` 会在挂载时启动斗鱼 WebSocket，用于直播间贵宾数和开播提示。
- “合成大猪头”不属于 `MainLayout` 路由页。入口和弹窗直接挂在 `App.vue`，因此包括 404 页在内的全站路由都会渲染它们。

## 路由和页面组件

所有主页面都挂在 `MainLayout` children 下，路由在 `src/router/index.ts`。

| 路径               | 页面组件                    | 主要用途                                                                   |
| ------------------ | --------------------------- | -------------------------------------------------------------------------- |
| `/home`            | `Home.vue`                  | 首页、公告、投稿库橱窗、随机烂梗、玩法预览入口                             |
| `/memes/:category` | `memes-view.vue`            | 烂梗列表页，目前主要 `/memes/AllBarrage`                                   |
| `/shieldWord`      | `shieldWord.vue`            | 屏蔽词列表、投票、投稿                                                     |
| `/post-bar`        | `post-bar-main.vue`         | 社区帖子流                                                                 |
| `/me-post`         | `Me-Post.vue`               | 我的帖子                                                                   |
| `/me-msg`          | `Post-Message.vue`          | 我的消息                                                                   |
| `/me-memes`        | `Me-memes.vue`              | 我的烂梗投稿                                                               |
| `/UserInfo`        | `user/components/index.vue` | 用户资料和修改密码                                                         |
| `/aichat`          | `AIChat.vue`                | AI 闲聊/造梗                                                               |
| `/matchPrediction` | `CS2Major.vue`              | Major 赛事竞猜                                                             |
| `/matchLib`        | `matchLib.vue`              | 赛事烂梗库                                                                 |
| `/image`           | `image.vue`                 | 主播相册和评论                                                             |
| `/dejaVuNiko`      | `deja-vu-niko.vue`          | 超级逮虾户战报，作者停更较久，首页推荐入口已暂时注释，路由和侧边栏入口保留 |
| `/15warriorsDonk`  | `15warriorsDonk.vue`        | 布雷德十五勇士榜                                                           |
| `/memeTop20`       | `memeTop20.vue`             | 年度 TOP20 展示                                                            |
| `/stale`           | `stale-hot/stale.vue`       | 烂度总榜、实时热度榜和烂度投票                                             |
| `/hotwall`         | `stale-hot/hotwall.vue`     | SSE 实时事件流和最近 5 分钟热度榜                                          |
| `/arena`           | `play/arena.vue`            | 每日烂梗对决、本周排行和历史周排行                                         |
| `/growth`          | `play/growth.vue`           | 当前用户段位、经验、勋章和经验排行                                         |
| `/lifecycle`       | `keep/lifecycle.vue`        | 四阶段生命周期看板和 DNA v6 关联图谱                                       |
| `/checkin`         | `keep/checkin.vue`          | 每日签到、梗币钱包和烂梗打赏                                               |
| `/update`          | `update-timeline.vue`       | 更新日志                                                                   |
| `/Tampermonkey`    | `Tampermonkey.vue`          | 油猴脚本说明                                                               |
| `/ChatRoom`        | `ChatRoom.vue`              | 聊天室独立路由                                                             |

`MemeCategory` 在 `src/constants/backend.ts` 同时控制侧边栏和移动端 Tab 的主要菜单项。新业务中 `/stale`、`/arena`、`/lifecycle`、`/hotwall` 在这里；`/growth` 和 `/checkin` 不在主导航，二者都在用户下拉菜单。首页玩法卡上方有近 5 分钟热度「此刻」条进 `/hotwall`；签到条桌面在原广告位、移动端在正文流底部进 `/checkin`。预览卡露出 `/arena`、`/lifecycle`、`/stale` 和 `/image`，并各自带一条实时数据钩子。
超级逮虾户战报当前因作者停更较久不再出现在首页趣味轮播，`MemeCategory` 侧边栏/移动端菜单和 `/dejaVuNiko` 路由仍保留。

## 核心页面和组件说明

### 首页 `Home.vue`

桌面端结构：

```text
Home
├─ 顶部 boom 图片
├─ cards-container
│  ├─ HomeIntro（公告、油猴、开播提醒、更新日志、友情推广）
│  └─ DidYouKnow
│     ├─ 投稿总量 + 最新投稿
│     └─ HomeSpotlight（你知道吗：上下滚入轮播，换一条对齐随机烂梗）
├─ RandomMeme
├─ HomeNowStrip（近 5 分钟热度第一名，整行进 /hotwall）
├─ HomePlaza（2×2 玩法预览卡：擂台 / 生命周期 / 烂度榜 / 相册）
├─ ChatRoom（移动端内容流里显示，桌面端 CSS 隐藏）
├─ HomeWordCloudPanel（移动端显示）
└─ HomeCheckinStrip（移动端正文流最底部；桌面由 HomeRightDock 挂在原广告位）
```

`HomeIntro.vue` 只承担站点公告和友情推广，不再放签到、成长或生命周期入口。友情推广区展示“弗一把”合作入口，卡片内置官网的 `CS MAJOR // PLAYER GUESSING` 英文标语，并使用可整卡点击的新窗口外链跳转合作网站。

`DidYouKnow.vue` 先展示投稿库规模和最新一条烂梗：总数链到全部烂梗页并单独一行大字，最新投稿时间下一行，梗文案再下一行点击复制。下方 `HomeSpotlight` 轮播 15 勇士、年度 TOP20 和时光机。15 勇士和 TOP20 标题仍是「你知道吗？」；切到时光机时标题恢复为「sb6657 时光机」，正文为「万恶之源，我们的来时路。旧版 sb6657.cn 考古专项。」，链接文案为 `sb6657.cn v1` / `sb6657.cn v2`。旧条先向下滚出再从上滚入下一条，带淡入淡出和减速曲线；右侧「换一条」沿用随机烂梗的文字+刷新图标。超级逮虾户不在轮播里。

`HomeCheckinStrip` 整行进 `/checkin`。桌面端由 `FloatingSidebar` 里的 `HomeRightDock` 固定在原广告位（约 `top: 30%`）；搜索词云仍在右下。移动端放在首页正文流最底部。未登录不请求签到接口，文案为「登录后每天领梗币」；已登录则读 `/machine/checkin/status`，展示今日未签到或已签到连续天数。悬停只改文字颜色。

桌面首页右侧词云不是 `Home.vue` 直接放的，而是 `MainLayout` 给 `.content--with-home-sidebar` 预留右侧空间，`FloatingSidebar` 固定显示 `HomeWordCloudPanel`。

`HomeNowStrip` 在玩法卡上方，整行进 `/hotwall`。用与热度墙相同的 SSE 拉一帧 `snapshot` 后立即断开，只展示近 5 分钟热度第一名和次数，不在首页保活事件流。

`HomePlaza` 四张整卡可点，只预览不在首页完成投票/打分。悬停只改标题和「去看」颜色，不上浮、不加阴影。数据分别来自 `/machine/arena/current` 的今日 PK、`/machine/lifecycle/dashboard` 四阶段数量、`/machine/stale/rank` 第一名，以及 `/machine/showImage` 最新一张照片。桌面端两列、`600px` 及以下改单列。

首页搜索词云的桌面端和移动端共用 `wordCloud.vue`。点击词条会沿用 Header 搜索的 `search` 路由查询参数打开全局搜索弹窗；首页随机烂梗卡片只有烂梗文案和右侧复制按钮触发复制，点击标签会携带 `tag` 查询参数跳转全部烂梗页，时间和其余空白区域不触发复制。

全局 `FooterBar` 将入口分为 `sb6657` 和 `友情链接` 两组。`sb6657` 按当前顺序展示 GitHub、官方交流群、建议/提交 BUG、油猴脚本、星空背景、更新日志、赞赏支持和 sb6657 旧版 v1/v2，其中交流群与赞赏使用 Footer 内的二维码弹窗；`友情链接` 展示玩机器直播间、dgq63136.cn、弗一把及两项 B 站友情推广。两组链接使用可换行 Flex 布局，下方分割线后按原有两行排版展示服务器到期时间，以及 IPv6 状态、网站运行天数和 2024 年运营起始标记。

### 烂梗列表 `memes-view.vue`

用于分类/全部烂梗展示：

- `/memes/AllBarrage` 时顶部显示标签筛选卡片。
- 支持通过 `/memes/AllBarrage?tag={dictValue}` 进入页面，自动选中对应标签并沿用现有标签筛选请求。
- 顶部保留投稿入口，并提供简洁的“最新投稿 / 复制最多”切换控件；两种模式分别使用后端固定的时间倒序和复制次数倒序，列表本身不显示冗余表头。
- 切换排序、切换标签时会回到第一页；翻页和复制后刷新会保持当前排序模式。
- 主体是 `el-table`：
    - id 列
    - 内容列，hover 弹出标签和投稿时间
    - 复制按钮列，复制后调用 `/machine/addCnt/{id}`
- 含屏蔽词的内容会用警告图标标记。
- 顶部投稿按钮通过 `useSubmissionDialogStore` 打开全局投稿弹窗，不再在列表内部创建弹窗实例。

### 投稿弹窗 `submission-dialog.vue`

`submission-dialog.vue` 只保留受控弹窗外壳，唯一实例挂载在 `global-dialog-host.vue`，由 `useSubmissionDialogStore` 管理显示状态。Header、烂梗列表和搜索无结果入口都调用同一个 store，不再各自创建弹窗。

- 标签选择：`tag-selector`
- 输入弹幕：`el-input textarea`
- 底部：可关联当前进行中的赛事 `/machine/InProgressMatch`
- 提交：`/machine/submission`

实际表单由 `meme-submission.vue` 负责。首页不再内嵌投稿表单，投稿只走这份全局弹窗。

### 标签选择器 `tag-selector.vue`

输入输出：

| 属性                   | 说明                                     |
| ---------------------- | ---------------------------------------- |
| `:tags`                | 全部标签，从 `memeTagsStore.memeTags` 来 |
| `v-model:selectedTags` | 当前已选标签                             |

UI：

- 上方显示已选标签，点击移除。
- 下方显示所有可选标签，点击加入。
- 标签带 icon，没 icon 时 store 会用默认 `tag.svg` 补。

### 顶部栏 `header-bar.vue`

`header-bar.vue` 只通过 `useIsMobile()` 在 `DesktopHeader` 和 `MobileHeader` 之间切换，不再承载具体 UI、弹窗和业务状态。双端组件没有用于互相显隐的媒体查询，各自维护独立模板和样式；桌面端吸顶定位由 `MainLayout.vue` 负责，Header 子组件只维护自身尺寸和内部排版。

桌面端 `desktop-header.vue` 显示：

- logo 和标题
- 24h 热门轮播入口
- 搜索框
- 上传照片/建议/BUG 按钮
- 商务/斗鱼/GitHub/赞赏入口
- 消息入口
- 主题切换入口
- 用户入口

移动端 `mobile-header.vue` 显示：

- 只渲染 logo，不渲染桌面标题。
- 搜索框和投稿按钮位于 logo 行。
- 操作按钮压缩成一行。
- 操作区提供主题切换入口。
- 24h 热门条在移动端以绝对定位显示，并且非首页时隐藏。

共享职责继续拆分为 `header-search.vue`、`hot-meme-dialogs.vue`、`header-submission-entry.vue`、`header-message-entry.vue`、`header-support-entry.vue`、`header-business-entry.vue` 和 `ThemeSwitcher.vue`。其中投稿入口只调用全局投稿弹窗 store；主题入口通过 `themeStore` 切换浅色、深色或跟随系统模式；其余组件负责各自的请求、弹窗状态和定时器清理，双端 Header 只决定排列方式。

### 搜索弹窗 `search-dialog.vue`

由 Header 搜索框打开：

- 顶部高级筛选区域可折叠。
- 支持时间范围、标签筛选、按时间/id 或复制次数排序。
- 表格展示搜索结果，关键词高亮。
- 无搜索结果时显示克制的蓝色“投稿”入口；点击后先关闭搜索弹窗，再打开全局投稿弹窗，避免两个弹层叠加。
- 每页 20 条。
- 移动端分页简化为 `prev, pager, next`，按钮文案变短。

### 热门弹窗 `meme-dialog.vue`

Header 里的 24h/7d 热门弹窗复用组件：

- 接收 `memeArr/loading/emptyText`
- Header 用 slot 塞标题和切换按钮。
- 表格结构与 `memes-view.vue` 接近。

这个组件当前还有不少内联样式和注释掉的点赞列，后续清理时可以参考已经整理过的 `memes-view.vue`。

### 贴吧模块

组件结构：

```text
post-bar-main.vue
├─ sendPost.vue
├─ 帖子卡片列表
│  ├─ 烂梗 popover
│  ├─ 表态 popover
│  ├─ 点赞
│  └─ CommentList.vue
│     └─ CommentItem.vue（递归 children）
└─ 加载更多
```

接口集中在 `/machine/Post/**`。移动端主要是帖子卡宽度变 100%，字体略缩，footer 操作仍横向排列。

### 赛事竞猜

组件结构：

```text
CS2Major.vue
├─ 赛事信息面板
├─ 阶段 Tab：onePhase / twoPhase / threePhase / champion
├─ MajorPhase.vue
│  └─ Base.vue（通用拖拽预测版）
├─ MajorChampion.vue（冠军单选拖拽）
└─ CoinPreviewDialog.vue
```

布局：

- 桌面端左侧赛事信息，右侧预测区。
- 1200px 以下开始调整宽度。
- 768px 以下改为纵向布局，队伍卡片和拖拽区压缩。
- 375px 以下还有更细的队伍卡适配。

### 赛事烂梗库 `matchLib.vue`

- 先展示赛事卡片列表 `/machine/getMatchList`。
- 点击赛事打开弹窗，展示该赛事期间投稿并关联的烂梗 `/machine/matchPageList`。
- 弹窗宽度桌面 75%，移动端 100%。

### AI 造梗 `AIChat.vue`

组件内部是两栏布局：

```text
AIChat
├─ 左侧 session-sidebar
│  ├─ 会话列表
│  └─ 新建/切换/右键删除
└─ 右侧 chat-main
   ├─ header
   ├─ chat-window
   └─ input-area
      ├─ 模式：闲聊 / 造梗
      ├─ 开关：思考过程 / 联网搜索
      └─ 发送框
```

特点：

- 会话接口走 `httpInstance`。
- 流式回复走原生 `fetch('/ai/chat/stream')`。
- Markdown 用 `marked` 渲染，再用 `DOMPurify` 清洗。
- 主题跟随系统深浅色。

### 成长与签到 `growth.vue`、`checkin.vue`

`growth.vue` 在挂载时并行读取个人成长、勋章墙、经验排行和梗币余额：

- 段位卡展示 `exp/level/levelName/nextLevelExp`，进度按当前经验除以下一级门槛计算。
- 四项摘要是投稿过审、梗币余额、上热榜次数和全站排名。
- 勋章接口返回 `{ all, owned }`，前端用 code 判断解锁状态并映射图标。
- 经验排行榜会高亮当前用户；页面没有自己的分页逻辑，直接展示接口返回结果。

`checkin.vue` 负责签到和钱包：

- 初次进入同时读取钱包与今日签到状态。
- 签到成功后更新连续天数、播放短暂反馈并重新加载钱包。
- 打赏区通过 `/machine/pageSearch` 远程搜索烂梗，再提交 `{ barrageId, amount }`；成功后清空选项并刷新余额。
- 钱包接口没有成功返回时，页面显示“登录后可签到、领梗币、打赏”的提示。

两页都位于用户下拉菜单，不要为了补主导航而把它们重复加入 `MemeCategory`。

### 烂度与擂台 `stale.vue`、`arena.vue`

`stale.vue` 有“烂度总榜”和“实时热度榜”两个 Tab：

- 总榜显示 `staleScore`，热榜优先显示 `hotScore`。
- 两个列表都从第 1 页开始、每页 20 条，通过 `IntersectionObserver` 触底加载；切换 Tab 会清空并重新请求。
- 前端的两个投票按钮分别提交固定代表分 90 和 20。投票成功后用后端返回的最新 `staleScore/hotScore` 就地更新当前项，不重拉整页。
- 标签字典是异步 store；列表仅在字典已到达时预计算 `_displayTags`。

`arena.vue` 分为今日对决、本周排行和历史周排行：

- `/arena/current` 同时返回 `matches`、日期范围和本周排名；投票成功后会重新拉这一份数据。
- 每场对决只能在前端判断为未投票且状态不是 `DONE` 时提交，`choice` 使用 1/2 表示左右选项。
- 历史接口先按 `weekStart` 分组，用户展开某周后才加载 `/arena/weekly/{weekStart}`，并缓存到该周的 `details`。
- `dailyResults` 是 JSON 字符串，页面解析失败时按空战绩处理。

### 生命周期与 DNA `lifecycle.vue`

页面同时承担三个层次的浏览任务：

1. 顶部展示 `BIRTH → BOOM → STALE → DEAD` 四阶段数量。
2. 每个阶段有独立滚动容器、页码、加载状态和 `IntersectionObserver`，按 20 条触底加载。
3. 点击阶段列表项或搜索结果后，打开 DNA v6 力导向图。

DNA 图使用 ECharts `graph/force`：点击节点在右侧显示文本、关键词、固定片段、槽位、模板、语义骨架和锚点；双击节点以它为中心重新查询；关系类型复选框会重建图表以过滤边。弹窗关闭时会 `dispose()` 当前 ECharts 实例。

页面还保留“母体 → 当前 → 衍生”的横向演变区域和 `getMemeDnaEvolutionV6()` 封装，但 `loadEvolution()` 内真正的请求目前被注释。维护时不要误判为接口已经在 UI 中正常工作；恢复时需要同时处理失败态、截断标记和节点重新查询。

### 实时热度墙 `hotwall.vue`

- 连接建立后展示连接状态、累计收到的事件数、最多 40 条实时事件和最近 5 分钟排行。
- 支持的事件标签包括 `submit/copy/search/view/pick/burst`。
- 页面直接从 `httpInstance.defaults.baseURL` 拼 URL，并手动带 `Authorization` 与官网来源头，然后读取 `ReadableStream`、按空行拆 SSE block。
- 卸载时设置 `alive = false`、中止请求、取消 reader 并清理重连计时器，避免页面离开后继续写 DOM。

### 合成大猪头 `components/MergePig/`

这是全局小游戏，不是路由页面：

```text
App.vue
├─ MergePigLauncher.vue（右侧可纵向拖动的入口）
└─ MergePigDialog.vue
   ├─ native/game.js（Matter.js 物理与 Canvas 绘制）
   ├─ native/wsClient.js（球序列、分数与结算）
   └─ REST 排行榜 / 我的排名
```

- 相同等级的猪头碰撞后合成下一等级，合成第 10 级通关；球体稳定越过警戒线 1.7 秒则结束。
- 服务端通过 `init` 和 `next` 控制当前/后续球序列。游戏每次落球发送 `drop`，分数变化同步到客户端对象，定时与结算消息再上报后端。
- 落球后以 `pendingBall` 等待确认；收到服务端 `next` 或 1 秒超时生成的离线补球后统一推进当前球与预告球，确认前不接受第二次落球。
- 打开弹窗时创建 WebSocket 和游戏实例并加载 TOP100、个人排名；关闭时关闭连接、销毁 Matter.js engine/runner/render，并清空挂载容器。
- 重新开始先确认，再销毁并重建游戏实例，最后发送 `restart`，以保证新实例已经绑定消息处理器。
- 桌面端弹窗是游戏区加 280px 排行榜；移动端是全屏弹窗，排行榜通过游戏内按钮按需显示，并提供关闭按钮返回游戏。
- 10 级图片放在 `public/merge-pig/assets/balls/`，运行时基于 `import.meta.env.BASE_URL` 拼成 `/merge-pig/...`；修改部署 base 时要一起验证资源地址。

`mergePigDialogVisible` 是模块级 `ref`，不是 Pinia store。Launcher 写入它，Dialog 监听它管理实例生命周期。

### 用户资料与一次改名

注册表单要求昵称必填且不能是邮箱格式。个人中心从 `/system/user/profile` 的 `renameQuota` 控制昵称输入框：剩余次数大于 0 时可通过 `PUT /system/user/profile` 保存，成功后读取后端返回的新 quota；后端未返回 quota 时前端本地减 1。旧用户资料若完全没有 `renameQuota` 字段，前端目前会按 1 次处理。

### 屏蔽词页面 `shieldWord.vue`

- 主列表是卡片网格，不是表格。
- 每个词可以投“这是屏蔽词”和“这不是屏蔽词”。
- 已判定不是屏蔽词的卡片会加 disabled/stamp。
- 另有投稿弹窗和“我投稿的屏蔽词”表格弹窗。
- 1200px/768px/500px 有多级响应式卡片布局。

### 图片和榜单页面

| 页面                 | 数据来源                                        | UI 说明                                                  |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `image.vue`          | `/machine/showImage`、`/machine/addCommentname` | 自适应照片网格（桌面多列、移动双列）、图片预览、卡内评论和评论弹窗；照片投稿走顶部「上传照片 / 建议/提交BUG」问卷，后台人工添加，页面内不能上传 |
| `memeTop20.vue`      | OSS JSON                                        | 年度 TOP20 静态榜单，年份下拉切换                        |
| `AnnualHotList.vue`  | `/machine/hotTop20/**`                          | 年度 TOP20 评选活动页                                    |
| `deja-vu-niko.vue`   | OSS JSON                                        | 战报式表格页面，首页趣味轮播不再展示，路由和菜单入口保留 |
| `15warriorsDonk.vue` | OSS JSON                                        | 榜单页面，可导出图片                                     |

时光相册已经按业务职责拆分：`image.vue` 只负责分页请求、失败重试、评论提交和弹窗选择态；`src/components/TimeAlbum/AlbumGallery.vue` 负责网格、无限滚动和加载状态，`AlbumPhotoCard.vue` 负责单张照片及其评论列表，`AlbumCommentDialog.vue` 负责表单校验。相册数据类型位于 `src/types/timeAlbum.ts`，不依赖 Vue 的标题、日期和响应规范化函数位于 `src/utils/timeAlbum.ts`。用户投稿照片不走相册页内上传，而是顶部「上传照片 / 建议/提交BUG」问卷，后台看到后再手动加入。

## 桌面端和移动端布局

### 全局断点

项目主要断点是：

| 断点          | 使用                                                      |
| ------------- | --------------------------------------------------------- |
| `600px`       | 全局移动端判断，`useIsMobile()` 也是 `(max-width: 600px)` |
| `601px`       | 桌面端样式起点                                            |
| `640px/680px` | 生命周期演变节点和“合成大猪头”原生游戏的窄屏适配         |
| `768px`       | 部分复杂页面，如首页卡片、赛事、投稿弹窗、随机烂梗        |
| `1200px`      | 赛事竞猜和屏蔽词卡片的中等屏适配                          |
| `375px/360px` | 赛事拖拽卡片和榜单超窄屏                                  |

`src/composables/useIsMobile.ts` 的 `useIsMobile()` 只认 600px，因此用它控制显隐的组件和 CSS 里的 768px 断点可能不完全一致。

### 桌面端

`MainLayout.vue` + `DesktopSidebar`：

- `MainLayout` 为 `DesktopHeader` 设置 sticky 吸顶，Header 自身只维护尺寸和内部排版。
- `DesktopSidebar` 仅在桌面端挂载，左侧 `el-menu` 使用与 55px Header 一致的 sticky 偏移，从页面开始滚动时便保持固定。
- `.main-content` 是横向 flex。
- `.content` 占剩余空间。
- 首页额外加 `.content--with-home-sidebar`，右侧预留 360px 给词云/广告。
- `FloatingSidebar` 显示可拖拽聊天室、首页词云、广告、竖排按钮。

### 移动端

`MainLayout.vue` + `MobileTopTabs`：

- `DesktopSidebar` 不挂载。
- `MobileTopTabs` 仅在移动端挂载；根选择栏同时负责 sticky 和横向滚动，内层容器负责排列 Tab 项。
- `MobileTopTabs` 的选中项在路由切换后若超出横向可视区，会自动平滑滚动并贴齐选择栏左侧。
- 内容区全宽。
- `MobileHeader` 不 sticky，内部换行。
- 内容区不设置全局实色背景，避免遮挡 `Starrysky.vue`；需要独立底色的页面由页面组件自行设置。
- `FloatingSidebar` 隐藏可拖拽聊天室和固定广告，只保留变窄的竖排入口。
- `Home.vue` 里显示移动端 `HomeWordCloudPanel`，聊天室进入内容流。
- 成长页的统计项换成两列、勋章固定两列；烂度页把投票操作移到整行底部；擂台把左右对手改为上下排列；签到页把打赏表单改为纵向。
- 生命周期阶段面板靠 `auto-fit/minmax(250px, 1fr)` 自然收成单列，DNA 图在 768px 以下改为图表在上、详情在下。
- “合成大猪头”的 Vue 弹窗在 600px 以下全屏，原生游戏样式另有 680px 断点，排行榜在移动端按需显示。这两个断点不是同一个概念。
- 许多页面表格仍然存在横向压力，后续如果优化移动端，优先看表格列宽和弹窗宽度。

## 目录地图

```text
public/
└─ merge-pig/assets/balls/   合成大猪头 1-10 级图片
src/
├─ apis/
│  ├─ httpInstance.ts        请求实例、token 刷新、错误处理
│  ├─ getMeme.ts             烂梗读取、时间/复制次数列表、搜索、标签、随机
│  ├─ setMeme.ts             复制计数、老投稿函数
│  ├─ getShieldWordDict.ts   屏蔽词字典
│  ├─ match.ts               赛事竞猜接口封装
│  ├─ memeDnaV6.ts           DNA v6 图谱和演变接口封装
│  └─ mergePig.ts            合成大猪头排行榜与个人排名
├─ constants/
│  └─ backend.ts             SERVER_ADDRESS、API 常量、侧栏菜单 MemeCategory
├─ stores/
│  ├─ memeTags.ts            标签字典缓存
│  ├─ shieldWordStore.ts     屏蔽词缓存和检测
│  ├─ useAuthStore.ts        登录弹窗和 userId
│  ├─ useSubmissionDialogStore.ts  全局投稿弹窗开关
│  ├─ GuiBinStore.ts         斗鱼贵宾数
│  └─ themeStore.ts          浅色/深色/跟随系统主题
├─ composables/
│  └─ useIsMobile.ts         监听 600px 媒体查询的 Vue composable
├─ utils/
│  ├─ common.ts              sleep 等无 Vue 上下文的通用函数
│  └─ timeAlbum.ts           相册标题、日期与接口数据规范化
├─ types/
│  ├─ memeDnaV6.ts           DNA 节点、关系边和评分明细类型
│  └─ timeAlbum.ts           相册图片、评论和分页数据类型
├─ components/
│  ├─ desktop-sidebar.vue   桌面端左侧菜单
│  ├─ mobile-top-tabs.vue   移动端顶部 Tab 和自动滚动
│  ├─ tag-selector.vue
│  ├─ global-dialog-host.vue  全局单例弹窗宿主
│  ├─ submission-dialog.vue
│  ├─ meme-submission.vue
│  ├─ ChatRoom.vue
│  ├─ wordCloud.vue
│  ├─ search-dialog-host.vue
│  ├─ search-dialog.vue
│  ├─ MergePig/
│  │  ├─ MergePigLauncher.vue / MergePigDialog.vue / state.ts
│  │  └─ native/             Matter.js 游戏、WebSocket 客户端和原生样式
│  ├─ TimeAlbum/             相册网格、照片卡片和评论弹窗
│  └─ home/*
└─ views/
   ├─ MainLayout/
   │  ├─ MainLayout.vue
   │  └─ components/
   │     ├─ Home.vue
   │     ├─ memes-view.vue
   │     ├─ header-bar/
   │     │  ├─ header-bar.vue       双端 Header 调度层
   │     │  └─ components/          双端 Header 与共享业务组件
   │     ├─ right-sidebar/
   │     ├─ post-bar/
   │     ├─ match-prediction/
   │     ├─ AiGenerateMemes/
   │     ├─ play/             growth.vue、arena.vue
   │     ├─ keep/             checkin.vue、lifecycle.vue
   │     ├─ stale-hot/        stale.vue、hotwall.vue
   │     └─ user/
   ├─ Starrysky.vue
   └─ IdleScreensaver.vue
```

## 状态和数据缓存

| Store / 状态               | 内容                   | 使用场景                           |
| -------------------------- | ---------------------- | ---------------------------------- |
| `memeTags`                 | 烂梗标签字典           | 标签选择器、烂梗 popover、投稿表单 |
| `shieldWordStore`          | 屏蔽词字典             | 烂梗列表和搜索结果标记风险内容     |
| `useAuthStore`             | 登录弹窗可见性、userId | 401 后弹登录，赛事预测读取 userId  |
| `useSubmissionDialogStore` | 全局投稿弹窗可见性     | Header、烂梗列表和搜索无结果入口   |
| `GuiBinStore`              | 斗鱼直播间贵宾数       | MainLayout 底部显示                |
| `themeStore`               | 浅色/深色/跟随系统模式 | 双端 Header 主题切换及全局样式     |
| `mergePigDialogVisible`    | 游戏弹窗可见性         | Launcher 和 Dialog 共享的模块级 `ref`，不是 Pinia |

`memeTags` 和 `shieldWordStore` 都用了 Promise loaded 模式：

```ts
memeTagsStore.tagsLoaded.then(() => {
    allTags.value = memeTagsStore.memeTags;
});
```

改组件时注意：如果页面一进来就要展示标签，不能假设 `memeTags` 已经有值。

## 样式现状和维护建议

全局样式：

- `src/assets/css/index.scss`：Element Plus 主题变量。
- `src/assets/css/global.css`：全局 reset、`.card`、`.el-backtop`、`.site-version` 等。
- `src/assets/css/dark.css`：只放 `html.dark` token 和 `html.dark body`。业务深色覆盖写在组件 scoped 的 `html.dark` 里。
- `themeStore` 将选择保存到 `localStorage` 的 `theme-mode`；`isDark` 依赖响应式的系统深色 flag，跟随系统时监听 `prefers-color-scheme`。`index.html` 在 Vue 启动前按同一规则给 `<html>` 加 `dark`，避免闪白。
- 浅色维持用色自由度，不要把浅色 hex 收成设计系统。深色覆盖走 token / `--el-*`。`invert`、配色 `!important` 这类凑合补丁不要再加。
- 固定皮（不跟官网壳）：合成大猪头游戏区、测谎仪仪表、赛事竞猜舞台、热度墙事件流内岛、签到钱包卡、3D 硬币预览、404、屏保。
- 跨会话大改动的计划写法见 `docs/ai-plans/README.md`。已完成的深色模式收口见 `docs/ai-plans/dark-mode.md`。

组件样式：

- 大多数是 `<style scoped lang="scss">`。
- 代码首先服务于人类阅读和维护，不能用 AI 生成速度为巨型组件、职责混杂或压缩排版辩护。
- 新增或本次实质重构的 Vue 单文件组件总行数不得超过 300 行；接近上限时按业务职责拆分，不能用堆叠单行代码规避限制。页面私有子组件按业务目录放到 `src/components/<页面或业务命名>/`，没有业务边界的纯透传组件同样不应创建。
- 纯函数留在 `src/utils/`；依赖 Vue 响应式状态、生命周期或浏览器订阅的复用逻辑统一放在 `src/composables/`，使用 `useXxx` 命名，不称为 hooks。
- 历史代码里还有不少行内样式，尤其是搜索弹窗、热门弹窗、帖子模块、相册、榜单页。
- 最近整理过：
    - `src/views/MainLayout/components/memes-view.vue`
    - `src/views/MainLayout/components/Home.vue`
    - `src/components/submission-dialog.vue`

继续清样式时建议：

1. 先只改一个组件，不要跨组件顺手重构。
2. 行内 `style` 迁到语义 class。
3. Element Plus 弹窗、popover、table 内部样式要注意 teleport 和 scoped，必要时用 `:deep()` 或给弹层内容自己的 root class。
4. 移动端先确认这个组件使用的是 600px 还是 768px，不要硬套一个断点。
5. 改完依次跑 `pnpm run lint`、`pnpm run typecheck` 和 `pnpm run build`。lint error 会阻断 CI；仓库里仍有历史 warning，后续可按模块逐步清理。

## 常见坑

- 后端不开源，接口行为只能从前端调用和返回处理推断。
- 很多接口没有统一放在 `API` 常量里，新增接口最好先补 `constants/backend.ts`，但查旧接口要全局搜 `httpInstance`。
- `tags` 字段是逗号分隔字符串，不是数组。
- `httpInstance.get/post` 返回的是后端 body，不是 AxiosResponse。
- AI 流式接口不走 `httpInstance`，要手动拼 `httpInstance.defaults.baseURL`，token 通过 `cookieUtils.getToken()` 读取。
- 热度墙也不走 Axios 响应拦截器：它用 `fetch` 手工解析 SSE，并手动复制官网来源头。这个头仍然只属于官网 Web 前端，不要把它抄到第三方调用示例。
- `/machine/dna` 是遗留常量，当前图谱使用 `/machine/dna/v6/{memeId}`；演变接口虽然已有封装，`lifecycle.vue` 内的实际请求仍被注释。
- “合成大猪头”没有路由，入口和弹窗挂在 `App.vue`；不要在 `MainLayout` 再挂一份，否则会出现两个全局实例。
- 合成大猪头的 REST 请求跟随 `SERVER_ADDRESS`，但 WebSocket 当前硬编码为 `wss://hguofichp.cn:10086`。切换测试或生产后端时两处要分别检查。
- `MergePigWsClient` 虽然提供 `sendPing()`，当前没有定时器调用它；现有定时任务只有每 20 秒的 `score_update`，不要把代码注释里的“30s 心跳”当成已启用行为。
- 合成大猪头的静态图使用 `import.meta.env.BASE_URL + 'merge-pig/'`；资源应放在 `public/merge-pig/`，不要移进 `src/assets` 后仍沿用原路径。
- 游戏弹窗用 `useIsMobile()` 的 600px 判断，原生游戏 CSS 用 680px；修改其响应式时要同时检查两层。
- `V3.14.0` 更新日志曾记录“AI 玩梗接龙”，但该功能已在 `V3.14.2` 前后端移除，当前没有对应路由、组件或接口，不要按旧日志恢复到架构说明。
- 生产环境会屏蔽 `console.log/dir/warn`，只保留 `console.error`。
- `main.ts` 每 24 小时自动 `location.reload()`。
- `FloatingSidebar.vue` 还有动态 `:style`，属于拖拽定位必需；不要和普通行内 CSS 一起机械删除。
- 当前 dev/build 会输出一些 Vite 警告，例如大 chunk、动态/静态 import 重复、某图片运行时解析；这些不是最近组件整理引入的。
