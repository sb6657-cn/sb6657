# 全站深色模式收口

- 状态：`done`
- 当前步骤：`S16`
- 创建日期：2026-09-11
- 相关讨论：深色模式是 `V3.14.9` 后加的半成品；不推倒重做整站。浅色用色保持自由，但 `invert`、颜色 `!important`、离谱滤镜值这类凑合补丁要趁机收掉。

## 目标

**浅色用色尽量维持现状。** 各页手写的颜色、渐变、米色顶栏字、浅粉底、毛玻璃半透明，都是浅色主战场的自由发挥，不合并成设计系统。

**浅色里的工程补丁要收。** `filter: invert()`、为互盖而写的颜色/背景 `!important`、`blur(12228px)` 这种胡写的值，不是自由度，是凑合。改到的文件里这些要干掉，改成正常选择器或正常数值。浅色观感允许因此有一点变化（例如手机帖子标签不再反相）。

**深色变成一套能读的统一皮。** 用户切到深色或跟随系统进入深色后，壳、卡片、文字、表单、弹窗、列表不再大块留白、黑字、浅灰底；不出现和第二套开关打架的主题。

深色下星空继续用现有暗色星空，不被整页实心底挡住。

## 非目标

- 不重写 Vue 项目、不换 UI 库、不上 Tailwind。
- **不把浅色做成设计系统。** 禁止合并浅色灰阶、禁止把浅色 hex 改成 EP 变量「顺便统一」。工程补丁（invert / 颜色 `!important` / 离谱滤镜值）不在此列，要收。
- 不为油猴教程截图、战报配图、相册照片做第二套深色资源。
- 不把小游戏和舞台页强行改成和官网壳一模一样的深色后台风。
- 不在本计划里做无关重构、不顺手治理全部行内样式。
- 不把 `dark.css` 做成「每个业务 class 一份 `html.dark` 覆盖表」。

## 锁定决策

1. **深浅分工。** 浅色 = 自由主战场，维持现状。深色 = token 统一，AI 按步骤补。两套要求不一样，禁止用「全站颜色只走 token」去改浅色。
2. **机制保持** `themeStore` + `<html class="dark">` + CSS 变量 + Element Plus `dark/css-vars.scss`。只用来给深色提供入口，不是用来重写浅色。
3. **浅色用色冻结，工程补丁不冻结。**
   - 不改有意的浅色颜色（hex / rgb / 渐变 / `yellow` / 顶栏米色 / 合作卡绿）。
   - 不改 `:root` 里现有 token 的值。
   - 已在用 `var(--card-bg)` 等变量的组件：`:root` 值不变则浅色保持。
   - **本步改到的文件里必须收掉的补丁**（见下方清单）。颜色可以仍用原来的 hex，但不要再用 invert 或颜色 `!important` 硬拧。
   - 除此之外不要借机统一浅色灰阶。
4. **深色写法。** 在原浅色规则下面加 `html.dark & { ... }`（或 scoped 里等价的 `html.dark` 后代），里面只用深色 token / `--el-*`。不要先把浅色改成 `var()` 再靠 `:root` 把浅色「凑回去」。补丁清掉之后，深色靠正常特异性覆盖，禁止再加一圈 `!important` 互打。
5. **深色 token 两层，不要第三套主色。**
   - 壳与卡片：`--body-bg`、`--body-color`、`--card-bg`、`--card-shadow`、`--content-bg`、`--header-*`、`--sidebar-*`。
   - 控件与次级文字：`--el-text-color-*`、`--el-fill-color-*`、`--el-border-color-*`、`--el-bg-color-*`、`--el-color-primary`。
   - 禁止再引入和 EP 抢身份的 `--primary-color: #38bdf8`。
6. **深色品牌色跟浅色品牌件对齐，但浅色其它杂色不强制对齐。** 深色标题用橙 `#ff552e`，投稿粉、EP 绿在深色里继续当强调色。浅色顶栏米色字、各页自己的灰/蓝/米，原样保留。
7. **深色星空优先于整页底。** 仅 `html.dark` 下 `--content-bg` 为 `transparent`。浅色 `--content-bg` 仍是 `#f2f3f5`。禁止在深色给 `.content` 刷不透明实心底。
8. **一个主题源。** AI 造梗、星空、主题按钮全部读 `themeStore.isDark`。删除未使用的 `ThemeDropdown.vue`。AI 造梗的 **浅色配色块保持现在的 `theme-light`**，只改开关接线。
9. **`isDark` 必须真正响应系统主题变化。** `matchMedia` 变化时要能驱动计算属性，不能只改 `html` class。
10. **`dark.css` 只放 `html.dark` 的 token 和极少量全局。** 业务选择器补丁在对应步骤迁进组件的 `html.dark &` 后删除。
11. **画布 / 图表 / 截图：** 浅色分支保持现在的配色；深色分支听 `isDark` 另给一套。或登记为「固定皮」。不允许深色仍画浅色底。
12. **固定皮（深色也不跟官网壳）：**
    - 合成大猪头游戏画布与弹窗内游戏区（米黄游戏皮）
    - 测谎仪仪表与机箱
    - 赛事竞猜舞台（白字玻璃拟态）
    - 热度墙事件流内岛、签到钱包卡、3D 硬币预览、404 太空页、屏保
    - 固定皮外围的官网壳、对话框在 **深色** 下仍要可读。浅色外壳不动。
13. **换色不是实质重构。** 超 300 行的历史页面只加深色覆盖时不强制拆文件。
14. **版本。** 用户可见的每一步按 patch 升级。S1 若浅色完全无感、深色几乎看不出，可与 S2 合并记一个 patch。全部做完默认不升 minor。

## 深色覆盖写法

浅色规则原样留下，深色只追加。Vue scoped SCSS：

```scss
.page-sub {
    color: #666;

    html.dark & {
        color: var(--el-text-color-secondary);
    }
}
```

行内浅色（如 `style="color: #606266"`）不要改成 token。可改成 class，class 的默认色仍是原来的 hex，再在 `html.dark &` 里覆盖。

禁止：

```scss
.page-sub {
    color: var(--el-text-color-secondary); // 浅色会被统一，违反冻结
}
```

`html.dark` 写在组件 scoped 里，不要继续往 `dark.css` 堆业务 class。

## 什么算该收的补丁

改到哪个文件，就清哪个文件里的这些东西。不要为了清补丁去改没排进本步的文件。

**要收：**

| 类型 | 已知位置 | 怎么收 |
| --- | --- | --- |
| `filter: invert(100%)` + `color: white !important` | `post-bar-main.vue`、`Me-Post.vue` 移动端 `.meme-tag span` | 删掉 invert 和这层 `!important`。浅色把 tag 字色写成能读的正常色（标签本身是 `#00FFFF` 底，用深色字即可）；深色再用 `html.dark &` 配 token。 |
| 侧栏颜色/背景 `!important` | `desktop-sidebar.vue` 与 `dark.css` 互打 | 浅色仍可用现在的黑字、半透明白激活、浅蓝 hover 渐变，但去掉 `!important`，用正常选择器。深色写在组件的 `html.dark &`，同样不要 `!important`。 |
| 赛事卡背景 `!important` | `matchLib.vue` 的 `.match-card` | 浅色仍可半透明白毛玻璃，去掉 `!important`。 |
| `backdrop-filter: blur(12228px)` | `matchLib.vue` | 改成合理模糊（建议 `blur(8px)` 或 `12px`），保留毛玻璃意图，不要这个胡写的半径。 |
| `dark.css` 业务 `!important` | 顶栏/侧栏/lifecycle 点名覆盖 | 迁进组件后删掉。S1 先删已经无效的 `:deep()` 那一段。 |
| 投票高亮 `background: #fffbe6 !important` | `stale.vue` | 浅色可继续用这个浅黄，去掉 `!important`；深色另写覆盖。 |

**不要当本计划去收（除非同一步已经在改该文件，且不是颜色问题）：**

- `z-index: 3001 !important` 这类层叠（`global.css` 回顶、版本号）
- `.el-table .cell { padding: 0 !important }`
- 合成大猪头 `display: none/flex !important`（游戏布局）
- `CoinPreviewDialog` 的 `margin: 0 !important`（压 EP 默认边距，非配色）

压 Element Plus 内部样式时，优先加明确 root class + `:deep()` 提高特异性，不要一上来 `!important`。若特异性实在打不过、只能留下 `!important`，执行记录写明原因，且仅限非配色（定位、显示、盒模型）。

## Token 契约

浅色 `:root` 必须等于当前 `global.css` 的值，**禁止改值**。深色只在 `html.dark` 里覆盖。深色专用键可以只出现在 `html.dark`，不必在 `:root` 凑一对。

| Token | 浅色（冻结，取现状） | 深色（统一） | 用途 |
| --- | --- | --- | --- |
| `--body-bg` | `#fff` | `#12141a` | `body` 兜底 |
| `--body-color` | `#333` | `#e6edf3` | 已走该变量的主文字；未走的浅色 hex 不改 |
| `--card-bg` | `#fff` | `#1a1f27` | `.card` 等已用变量的底 |
| `--card-shadow` | `0 0 10px rgba(0, 0, 0, 0.1)` | `0 4px 16px rgba(0, 0, 0, 0.35)` | 已用变量的阴影 |
| `--content-bg` | `#f2f3f5` | `transparent` | 浅色整页灰底保持；深色让星空 |
| `--header-bg` | `#fff` | `rgba(18, 20, 26, 0.88)` | 已用变量的顶栏底；组件里写死的 `#fff` 浅色不改 |
| `--header-text` | `#333` | `#e8eef4` | 仅深色覆盖用。浅色顶栏米色字不改成这个值 |
| `--header-title-color` | `#ff552e` | `#ff552e` | 标题橙；深色从天蓝改回橙（只影响深色） |
| `--header-border` | `#e5e7eb` | `#2a3340` | 分割线 |
| `--sidebar-bg` | `#fff` | `transparent` | 浅色侧栏 token 维持；组件写死的浅色不改 |
| `--sidebar-text` | `#333` | `#c5d0dc` | 深色侧栏文字 |

搜索命中：浅色继续 `yellow`。深色用 `html.dark & { background-color: #8c6d1f; }`（或只在 `html.dark` 定义 `--search-hit-bg`）。不要把浅色 `yellow` 换成偏金的 `#ffe58f`。

## 进度总表

| ID | 标题 | 状态 |
| --- | --- | --- |
| S0 | 计划与规范入库 | 完成 |
| S1 | 深色 token 写入，收掉无效补丁；浅色 `:root` 不动值 | 完成 |
| S2 | 主题引擎：响应式 `isDark` + 深色首屏防闪白 | 完成 |
| S3 | 单一主题源：AI 造梗接 store，浅色聊天皮保持 | 完成 |
| S4 | 顶栏与主题按钮的深色覆盖 | 完成 |
| S5 | 侧栏、移动端 Tab、版本号的深色覆盖 | 完成 |
| S6 | 首页深色覆盖 | 完成 |
| S7 | 烂梗列表、标签、投稿的深色覆盖 | 完成 |
| S8 | 搜索与热门弹窗的深色覆盖 | 完成 |
| S9 | 登录 / 注册 / 重置密码的深色覆盖 | 完成 |
| S10 | 社区帖子与评论的深色覆盖 | 完成 |
| S11 | 用户中心、页脚、屏蔽词、更新日志、油猴、年度榜的深色覆盖 | 完成 |
| S12 | 玩法页深色覆盖 | 完成 |
| S13 | 生命周期页深色覆盖（不含 ECharts 重绘） | 完成 |
| S14 | 赛事库、战报、15 勇士页深色覆盖 | 完成 |
| S15 | 图表、词云、分享截图的深色分支 | 完成 |
| S16 | 固定皮外围深色 + `dark.css` 清场 + 文档 | 完成 |

## 步骤

### S0 计划与规范入库

- 完成标志：`docs/ai-plans/README.md` 与本文件存在；`AGENTS.md` / `AI_GUIDE.md` 能链到它们。
- 文件：`docs/ai-plans/*`、`AGENTS.md`、`AI_GUIDE.md`、`.agents/skills/project-feature-flow/SKILL.md`
- 不要做：任何业务代码、版本号。
- 验收：规范可独立阅读；本计划可从 S1 开做。
- 版本：纯文档，不升级。

### S1 深色 token 写入，收掉无效补丁

- 完成标志：`:root` 现有键值与改前 **逐字相同**；`html.dark` 按上表写入深色值；删除 `:deep()` 死代码；删除 `--primary-color` / `--primary-hover`；深色标题 token 为橙；不要改浅色 loading / 浅色 `--content-bg`。
- 文件：
  - `src/assets/css/global.css`（原则上不改值；若只加注释可以）
  - `src/assets/css/dark.css`
- 不要做：动 Vue 页面；删仍在撑场面的顶栏/侧栏深色覆盖（S4/S5 迁完再删）；不要把浅色 token 改成半透明白或 `transparent`。
- 验收：
  - `:root` 的 `--header-bg` 仍是 `#fff`，`--content-bg` 仍是 `#f2f3f5`，`--sidebar-bg` 仍是 `#fff`。
  - 全局 CSS 没有 `:deep(`。
  - grep 不到 `--primary-color`。
  - `pnpm run lint`、`typecheck`、`build`。
- 版本：浅色无感则延后到 S2；若深色标题从蓝变橙已可见，S1 单独 patch，更新日志只写深色。

### S2 主题引擎：响应式 `isDark` + 深色首屏防闪白

- 完成标志：
  1. 跟随系统时 OS 主题变化会更新 `isDark`，不只改 `html` class。
  2. `index.html` 在 Vue 启动前按 `theme-mode` / 系统偏好给 `<html>` 加 `dark`。
  3. **浅色 loading 仍是白底。** 只增加 `html.dark #global-loading` 的深色底，不要改默认 `#fff`。
- 文件：
  - `src/stores/themeStore.ts`
  - `index.html`
  - 如有必要：`src/main.ts`（只补 apply，不搬逻辑）
- 不要做：改 AIChat、改页面颜色、改浅色 loading 文案色除非深色对比不够（浅色 loading 字色保持）。
- 实现要点：
  - 用 ref 保存系统是否深色，在 `matchMedia('change')` 里赋值；`isDark` 依赖 `mode` 和这个 ref。
  - 首屏脚本内联、同步、尽量短。
  - `color-scheme` 随 `html.dark` 切换。
- 验收：能看懂 listener 与 computed 依赖；浅色 `#global-loading { background-color: #fff }` 仍在。lint / typecheck / build。
- 版本：与 S1 合并或单独 patch。更新日志只描述深色/跟随系统，不写浅色改版。

### S3 单一主题源

- 完成标志：`AIChat.vue` 不再自己听 `prefers-color-scheme`；`theme-dark` / `theme-light` 由 `themeStore.isDark` 决定。**`.theme-light` 里现有颜色值不改。** 删除无引用的 `ThemeDropdown.vue`。
- 文件：
  - `src/views/MainLayout/components/AiGenerateMemes/AIChat.vue`
  - `src/components/ThemeDropdown.vue`（删除）
- 不要做：重做 AI 造梗布局；不要把 `theme-light` 收成站点 token。
- 验收：grep `prefers-color-scheme` 只剩 `themeStore` 和 `index.html`。`theme-light` 色值与改前一致。lint / typecheck / build。
- 版本：patch。「AI 造梗跟随站点主题开关」。

### S4 顶栏与主题按钮的深色覆盖

- 完成标志：深色下顶栏底、标题、热门字、消息字可读；GitHub 深色可见。**浅色维持：** 移动端 `#fff` 底、热门/消息米色 `#e4d6b8` / `#e3d5b8`、投稿粉、主题按钮现状（含桌面白图标和移动端 `.mobile-light`）。
- 文件：
  - `src/views/MainLayout/components/header-bar/components/desktop-header.vue`
  - `src/views/MainLayout/components/header-bar/components/mobile-header.vue`
  - `src/components/ThemeSwitcher.vue`
  - `src/assets/icons/msg.svg`（浅色 fill 不改；深色用外层 `html.dark` 的 filter 或等价，不要把 SVG 改成 `currentColor` 以致浅色铃铛变深灰）
  - GitHub：仅 `html.dark` 下 `filter: invert(1)`（或等价）
- 不要做：把浅色米色字改成 `#333`；不要改搜索框（S8）；不要「修正」浅色主题按钮对比度。
- 验收：diff 里浅色颜色字面量仍在；新增覆盖都在 `html.dark` 下。lint / typecheck / build。
- 版本：patch。「深色模式适配顶栏与主题切换按钮」。

### S5 侧栏、移动端 Tab、版本号的深色覆盖

- 完成标志：深色下侧栏文字/激活/hover、Tab、版本号可读；`dark.css` 里对应业务覆盖删掉。浅色仍可用黑字、白 Tab、浅蓝 hover 渐变、版本号黑色。**本步收掉侧栏全部颜色/背景 `!important`，深色也不许用 `!important` 再盖回去。**
- 文件：
  - `src/components/desktop-sidebar.vue`
  - `src/components/mobile-top-tabs.vue`
  - `src/views/MainLayout/MainLayout.vue`
  - `src/assets/css/dark.css`
- 不要做：不要改图标资源；不要把浅色 hover 渐变收成 EP 默认蓝。
- 验收：这两个侧栏/dark 文件 grep 不到配色 `!important`。浅色色值还在。lint / typecheck / build。
- 版本：patch。「深色模式适配导航与版本号」。

### S6 首页深色覆盖

- 完成标志：深色下简介、随机烂梗、你知道吗、合作卡、聊天室不出现浅色灯箱字。**浅色合作卡、气泡色、标题色全部保留。** 深色合作卡可单独写一块覆盖，不要改浅色品牌块去「适应深色」。
- 文件：
  - `src/views/MainLayout/components/Home.vue`
  - `src/components/home/homeIntro.vue`
  - `src/components/home/random-meme.vue`
  - `src/components/home/didYouKnow.vue`
  - `src/views/MainLayout/components/right-sidebar/HomeWordCloudPanel.vue`（壳；词云绘图留 S15）
  - `src/components/ChatRoom.vue`
  - `src/views/MainLayout/components/right-sidebar/FloatingSidebar.vue`（不改拖拽 `:style`）
- 不要做：重排首页；把合作卡浅色改成灰卡；改词云 ECharts。
- 验收：`#201118`、`#f3f0ea`、`#c9ea16`、聊天气泡浅色仍在默认规则里。lint / typecheck / build。
- 版本：patch。「深色模式适配首页」。

### S7 烂梗列表、标签、投稿的深色覆盖

- 完成标志：深色下列表工具条、标签 hover、投稿说明可读。**浅色维持** `#fff5f8` 投稿钮、`#ecf5ff` hover、`#303133` 说明字。
- 文件：
  - `src/views/MainLayout/components/memes-view.vue`
  - `src/components/tag-selector.vue`
  - `src/components/meme-submission.vue`
  - `src/components/submission-dialog.vue`（核验，浅色不动）
- 不要做：改复制逻辑；把浅色投稿钮收成 EP 默认按钮。
- 验收：上述浅色 hex 仍在未包 `html.dark` 的规则里。lint / typecheck / build。
- 版本：patch。「深色模式适配烂梗列表与投稿」。

### S8 搜索与热门弹窗的深色覆盖

- 完成标志：深色下命中高亮、筛选区、热门表可读。**浅色维持** `yellow` 高亮和 `#e4e7ed` 边框底。
- 文件：
  - `src/components/search-dialog.vue`
  - `src/views/MainLayout/components/header-bar/components/meme-dialog.vue`
  - `src/views/MainLayout/components/header-bar/components/hot-meme-dialogs.vue`
  - `src/views/MainLayout/components/header-bar/components/header-search.vue`（已用 EP 变量则浅色不动；深色跟 EP 暗色即可）
- 不要做：改搜索接口；把 `yellow` 换成别的浅色高亮。
- 验收：仍能 grep 到 `yellow`（不在 `html.dark` 块里）。lint / typecheck / build。
- 版本：patch。「深色模式适配搜索与热门弹窗」。

### S9 登录 / 注册 / 重置密码的深色覆盖

- 完成标志：深色弹层里标题、链接、滑块轨道对比足够。**浅色维持** `#707070`、`#1677ff`、`#f5f7fa`。
- 文件：
  - `src/views/MainLayout/components/header-bar/components/login.vue`
  - `src/views/MainLayout/components/header-bar/components/register.vue`
  - `src/views/MainLayout/components/header-bar/components/resetPassword.vue`
  - `src/views/MainLayout/components/user/components/resetPwd.vue`
- 不要做：改登录态、改验证码请求、统一浅色链接色。
- 验收：默认规则仍是原 hex。lint / typecheck / build。
- 版本：patch。「深色模式适配登录注册」。

### S10 社区帖子与评论的深色覆盖

- 完成标志：深色下时间、表态、空评论、回复字可读。**删掉** 移动端 `.meme-tag` 的 `filter: invert(100%)` 和 `color: white !important`，改成正常字色（浅色在青底 `#00FFFF` 上用深色字；深色用 token，不要再 invert）。其它浅色 `#999` / `#808080` / `orangered` 保留。
- 文件：
  - `src/views/MainLayout/components/post-bar/post-bar-main.vue`
  - `src/views/MainLayout/components/post-bar/Me-Post.vue`
  - `src/views/MainLayout/components/post-bar/CommentList.vue`
  - `src/views/MainLayout/components/post-bar/CommentItem.vue`
  - `src/views/MainLayout/components/post-bar/sendPost.vue`
  - `src/views/MainLayout/components/post-bar/Post-Message.vue`
- 不要做：改点赞/评论接口；不要把时间灰 `#999` 收成统一灰。
- 验收：这两个帖子文件 grep 不到 `invert(` 和 tag 上的 `color: white !important`。lint / typecheck / build。手机浅色标签允许和现在不一样（应更正常）。
- 版本：patch。「深色模式适配社区帖子，并去掉标签反相补丁」。

### S11 用户中心、页脚、屏蔽词、更新日志、油猴、年度榜的深色覆盖

- 完成标志：深色下这些信息页主文字、边框、提示条可读。**浅色维持** `black` / `#303133` / `#606266` / 表头红。
- 文件：
  - `src/views/MainLayout/components/user/components/userInfo.vue`
  - `src/views/MainLayout/components/user/components/Me-memes.vue`
  - `src/views/MainLayout/components/user/components/index.vue`
  - `src/views/MainLayout/components/footer-bar.vue`
  - `src/views/MainLayout/components/shieldWord.vue`
  - `src/views/MainLayout/components/update-timeline.vue`
  - `src/views/MainLayout/components/Tampermonkey.vue`
  - `src/components/AnnualHotList.vue`
  - `src/views/MainLayout/components/memeTop20.vue`
- 不要做：改榜单规则、改更新日志结构、合并浅色灰字。
- 验收：浅色正文 hex 仍在。lint / typecheck / build。diff 太大可拆 S11a / S11b 并回写本表。
- 版本：patch。「深色模式适配页脚、榜单与说明页」。

### S12 玩法页深色覆盖

- 完成标志：深色下列表项、空态、spinner、副标题可读。已用 `var(--content-bg)` 的根节点浅色仍是灰底（token 浅色值不变），深色随 `html.dark` 变透明。热度流内岛、签到钱包卡保持固定皮。
- 文件：
  - `src/views/MainLayout/components/play/growth.vue`
  - `src/views/MainLayout/components/play/arena.vue`
  - `src/views/MainLayout/components/stale-hot/stale.vue`
  - `src/views/MainLayout/components/stale-hot/hotwall.vue`
  - `src/views/MainLayout/components/keep/checkin.vue`
- 不要做：改玩法接口；把浅色 `#fff` 卡片改成变量；不要把钱包卡改浅。
- 验收：`#666` / `#999` / `#fff` 仍出现在非 `html.dark` 规则。`stale.vue` 投票高亮若仍用浅黄，须去掉 `!important`。lint / typecheck / build。
- 版本：patch。「深色模式适配成长、擂台、烂度与签到」。

### S13 生命周期页深色覆盖（不含 ECharts 重绘）

- 完成标志：深色下 hero / timeline / 关系 tag / 图容器底可读。把 `dark.css` 的 `.dna-hero-bg` / `.stage-timeline` 点名补丁迁进组件 `html.dark &`。**浅色粉彩渐变保持。**
- 文件：
  - `src/views/MainLayout/components/keep/lifecycle.vue`
  - `src/assets/css/dark.css`
- 不要做：改 DNA 算法、改 ECharts option（S15）；不要为覆盖拆大文件；不要把浅色 hero 改成深色渐变当默认。
- 验收：`dark.css` 不再有这两个 class；组件默认规则仍是浅色渐变。lint / typecheck / build。
- 版本：patch。「深色模式适配梗生命周期页」。

### S14 赛事库、战报、15 勇士页深色覆盖

- 完成标志：深色下赛事卡、战报斑马纹、15 勇士容器可读。浅色赛事卡仍可半透明白毛玻璃，但 **去掉背景 `!important`**，并把 `blur(12228px)` 收成 `8px` 或 `12px`。竞猜舞台仍是固定皮。
- 文件：
  - `src/views/MainLayout/components/match-prediction/matchLib.vue`
  - `src/views/MainLayout/components/match-prediction/CS2Major.vue`（仅舞台外深色残留）
  - `src/views/MainLayout/components/match-prediction/Base.vue`
  - `src/views/MainLayout/components/match-prediction/MajorPhase.vue`
  - `src/views/MainLayout/components/match-prediction/MajorChampion.vue`
  - `src/views/MainLayout/components/deja-vu-niko.vue`
  - `src/views/MainLayout/components/15warriorsDonk.vue`（仅 CSS；截图留 S15）
  - 核验相册：已用 token 且 `:root` 未改值则浅色本就不变，只补深色缺口
- 不要做：改预测提交；把浅色毛玻璃改成实心白卡；把舞台白字改深色字。
- 验收：`matchLib.vue` 仍有半透明白，但 grep 不到配色 `!important` 和 `12228`。lint / typecheck / build。
- 版本：patch。「深色模式适配赛事库与战报页」。

### S15 图表、词云、分享截图的深色分支

- 完成标志：浅色仍用现在的图表/截图配色；`isDark === true` 时走深色 tooltip/底/字。`watch(isDark)` 或等价重绘。
- 文件：
  - `src/components/wordCloud.vue`
  - `src/views/MainLayout/components/keep/lifecycle.vue`（仅 chart option 深色分支）
  - `src/views/MainLayout/components/15warriorsDonk.vue`（分享图深色底/字；浅色仍 `#f5f5f7`）
  - `src/views/MainLayout/components/match-prediction/CS2Major.vue`（`html2canvas` 深色分支；浅色仍白底）
- 不要做：重做布局算法；把浅色默认 option 改成深色；合成大猪头 canvas 仍固定皮。
- 验收：浅色常量仍是默认分支。lint / typecheck / build。
- 版本：patch。「深色模式下词云、图谱与分享图跟随主题」。

### S16 固定皮外围深色 + `dark.css` 清场 + 文档

- 完成标志：
  1. 深色下猪头 **Launcher / 弹窗外壳** 不再纯白；游戏区内米黄皮不动。
  2. `dark.css` 几乎只剩 `html.dark { token }` 和 `html.dark body`。
  3. `AI_GUIDE.md` 写明：浅色可继续自由写 hex；深色覆盖用 token；固定皮名单。
  4. 无 `ThemeDropdown`、无 AIChat 私有系统监听。
- 文件：
  - `src/components/MergePig/MergePigLauncher.vue`
  - `src/components/MergePig/MergePigDialog.vue`
  - `src/assets/css/dark.css`
  - `AI_GUIDE.md`
  - 本计划（状态改为 `done`）
- 不要做：重写 `MergePig/native/style.css`；不要写「新代码禁止浅色 hex」。
- 验收：`dark.css` 无组件级 class；浅色游戏皮文件未改。lint / typecheck / build。
- 版本：patch。「完成深色模式收口」。

## 每步通用验收（代码侧）

- 只改本步列出的文件，除非编译/引用被迫。
- **diff 审查浅色：有意的颜色字面量应仍在。** 新增配色几乎只出现在 `html.dark`（或 `isDark === true` 的 JS 分支）。
- 本步改到的文件：配色不得再留 `filter: invert`、颜色/背景 `!important`、离谱滤镜半径。
- 不要把「grep 不到 #666」当成完成标准；那是浅色用色冻结的反面。
- 双端沿用组件已有断点。
- 不跑 dev / 不打开浏览器，除非用户在该次对话明确要求。
- 回复里写：步骤、计划已勾选、请用户用 **浅色对照现状** 和 **深色看可读性**。

## 用户肉眼验收清单（全部完成后）

浅色先对照现在的记忆：顶栏米色热门字、首页合作卡、赛事毛玻璃、搜索黄高亮、各页杂色灰，应还在。允许不一样的：手机帖子青标签不再反相、侧栏不再靠 `!important` 互盖（颜色应接近）、赛事卡模糊程度正常。

再看深色、跟随系统，桌面和手机各一遍：

1. 深色刷新不应先闪白 loading；浅色 loading 仍是白的。
2. 深色顶栏、侧栏/Tab、版本号、GitHub、消息铃铛可读。
3. 深色首页、烂梗、搜索、投稿、登录框可读。
4. 深色社区、AI 造梗（站点强制浅色时 AI 页必须是现在的浅色皮，不得跟系统误切深色）。
5. 深色成长/签到/生命周期、赛事库、猪头外壳可读；游戏区和竞猜舞台仍是固定皮。
6. 「跟随系统」时切 OS 主题：深色壳和星空一起变；切回浅色应回到冻结的现状。

## 执行记录

| 日期 | 步骤 | 结果 |
| --- | --- | --- |
| 2026-09-11 | S0 | 规范落入 `docs/ai-plans/README.md`，本计划创建为第一份落地文件。 |
| 2026-09-11 | 计划修订 | 锁定浅色外观冻结、浅色用色自由；深色才走 token 覆盖。各步骤验收改为「浅色字面量保留 + `html.dark` 追加」。 |
| 2026-09-11 | 计划修订 | 工程补丁从冻结里拿出来：`invert`、配色 `!important`、`blur(12228px)` 在改到的文件里必须收掉。 |
| 2026-09-11 | S1–S16 | 按计划落地深色 token、主题引擎、页面覆盖、图表分支与文档收口。版本按 goal 要求只在全部完成后升一次 patch（`V3.15.4.20260911`）。 |
