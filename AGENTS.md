# AGENTS.md

给 AI coding agent 的项目约定，适用于 Codex、Claude Code 或其他 CLI/IDE agent。与源码冲突时以源码为准，并在同一次改动里更新本文。

## 先读什么

按任务读相关文件，不要整本预读。

- 接口、页面结构、布局、状态或常见坑：`AI_GUIDE.md` 的对应小节。
- 项目定位、官网、后端说明、版权：`README.md`。
- 版本号或用户可见能力：先读 `docs/版本策略.md`，再看 `docs/更新日志.md`。
- 油猴脚本说明页或第三方脚本文案：才读 `docs/油猴脚本.md`。
- 跨会话大改动：`docs/ai-plans/README.md`。用户说按计划做时，只执行对应计划的「当前步骤」，不要另起平行方案。
- 文档与代码不一致：以离改动最近的源码为准。

## 项目是干什么的

这是 `sb6657.cn` 的 Vue 前端，用来收集和展示斗鱼主播「玩机器」相关的烂梗、弹幕、帖子、赛事和 AI 造梗内容。定位是玩小将的在线记事本，不是通用后台或内容管理系统。

后端不开源。不要假设协议，从前端调用、响应和 `AI_GUIDE.md` 相关节推断。

主要技术栈：Vue 3、Vite、TypeScript、Vue Router、Pinia、Element Plus、SCSS、Axios；另有 ECharts wordcloud、Three.js、Matter.js、`html2canvas`、`html-to-image`。不要擅自换成 Tailwind、其他 UI 库或 Nuxt。

## 项目约束

- Node `>=22.13.0`，包管理器 `pnpm@11.3.0`。CI 用 `pnpm install --frozen-lockfile`，再跑 lint、typecheck、build。
- History 路由；静态站点直达子路由依赖 `public/404.html` 和 `src/router/index.ts` 的重定向。
- 项目归属 `sb6657-cn` 组织。部署细节见 `AI_GUIDE.md` 的「部署和 CI」。组织下旧版站点发布在 `sb6657.cn/<仓库名>/`；`sb6657oss.wishao.fun` 是独立 OSS 静态资源域名，与 GitHub Pages 无关。
- 未经明确要求，不要改 workflow、环境文件、生产后端地址或路由模式。
- 不要改 `dist/`、`.pnpm-store/`、`node_modules/`、`tsconfig.node.tsbuildinfo`。
- GitHub Actions 忽略 Markdown-only 改动，不会触发部署。

## 验证

- 改代码后默认跑 `pnpm run lint`、`pnpm run typecheck`、`pnpm run build`。纯文档或本地阻塞时可以不跑，但要说明原因。
- lint 使用 ESLint 9 flat config；error 阻断 CI。历史 warning 可留，但要区分本次引入和旧债。
- 改 UI 时从代码层面同时看桌面端和移动端，沿用被改组件已有的断点。
- 除非用户在当前任务明确要求，否则禁止运行 `pnpm run dev` / `pnpm run preview`、打开或控制浏览器、用截图/录屏/像素对比做视觉验收。UI 效果留给用户确认；涉及 UI 的回复写明未做浏览器预览。

## 版本和更新日志

改代码后必须同步版本，不要等用户提醒。纯内部文档默认不升版本。

- 先读本地当天日期，不要猜。
- 先读 `docs/版本策略.md`，再决定 major / minor / patch；不要因为 commit 写了 `feat` 就升 minor。
- 三处 major、minor、patch、日期必须一致：
    - `docs/更新日志.md`：`## 版本【Vmajor.minor.patch.yyyymmdd】`
    - `package.json`：`major.minor.patch+yyyymmdd`
    - `src/apis/httpInstance.ts` 的 `sbVersion`：`Vmajor.minor.patch.yyyymmdd`
- `pnpm-lock.yaml` 不记录根包发布版本，禁止手工写入发布版本。
- 一次任务或发布批次只升一次；同一未发布批次在已有标题下追加。一天内多个独立批次继续递增 patch，日期可以相同。
- 更新日志沿用 `1、【新增】` / `【优化】` / `【修复】` / `【修改】` / `【重构】`。旧 `YY.MM.DD` 标题不要改写。

## 代码约定

- 可读性优先：给人连续读懂、放心改；不要为了少占行数去压缩排版、堆叠单行或把职责塞进巨型组件。
- 格式以 `.prettierrc.cjs` 和 ESLint 为准，不要按业界默认猜。本项目是 **4 空格缩进**、空格不用 tab、单引号、分号、`printWidth: 300`、`trailingComma: 'es5'`。不是 2 空格。
- 保持 LF 换行和文件末尾换行。
- Vue 通常是 `<script setup lang="ts">` + scoped SCSS；局部风格不同时跟随文件。
- 新增或本次实质重构的 `.vue` 合计不超过 300 行；接近上限按业务职责拆。历史超限且不在本次实质修改范围的，不要顺手拆。改完检查本次新增和实质修改的 `.vue` 行数。
- 页面私有子组件放 `src/components/<页面或业务命名>/`；路由页编排数据，子组件做展示和交互。不要造无业务含义的透传组件。
- 纯函数放 `src/utils/`。用到 Vue 响应式、生命周期或浏览器订阅的复用逻辑放 `src/composables/`，命名 `useXxx`，不要叫 hooks。
- 从 `src` 导入用 `@/*`。优先已有 Element Plus 组件和 `@element-plus/icons-vue` 图标。不要轻易加生产依赖。
- 注释要短且有用，不给显而易见的代码写解释。

## 请求和后端

- `SERVER_ADDRESS` 读 `VITE_BASE_URL`，默认 `https://api.hguofichp.cn`；WebSocket 用由它派生的 `WS_SERVER_ADDRESS`，不要再硬编码 host 或端口。
- `httpInstance.get/post` 返回后端 body `{ code, data, msg }`，不是 AxiosResponse。实例方法泛型 `T` 是 `data`；轻封装 `get`/`post` 返回 `{ _failure, flatData }`。
- 拦截器会加 `siteToken`（匿名统计）、`dpahjdoiaw`（官网 Web 来源统计）、登录后的 `Authorization`。
- `dpahjdoiaw` 不是鉴权密钥。禁止写进 QQ bot、agent、油猴脚本、第三方客户端、文档示例或任何非官网 Web 前端调用。
- AI 流式聊天走原生 `fetch`，不要改成 `httpInstance`，除非任务就是改 AI 会话。
- 旧接口不一定在 `API` 常量里；判断是否使用前要全局搜索。

## UI

- 桌面端和移动端布局差得多，不要只改桌面。
- `useIsMobile()` 是 `(max-width: 600px)`，和组件 CSS 里的 `768px` 等断点不是一回事。
- `MainLayout.vue` 负责壳、设备分流（桌面侧栏 / 移动 Tab）、桌面 Header 吸顶，并只挂一个 `global-dialog-host.vue`。跨页面弹窗挂到该宿主，用独立 Pinia store 开关，不要多处各挂一份。
- `header-bar.vue` 只按 `useIsMobile()` 挂桌面或移动 Header；双端模板和样式分开维护。
- `FloatingSidebar.vue` 的动态 `:style` 是拖拽定位需要的，不要当行内样式清掉。
- Element Plus 弹层优先给内容加 root class；scoped 打不到时用 `:deep()`。清行内样式一次只迁一个组件。

## 容易踩的坑

- `memeTags` 异步加载，首屏不要假设已有标签。
- `shieldWordStore` 用于烂梗列表和搜索风险标记。
- 后端 `tags` 经常是逗号分隔字符串，不是数组。
- 登录态走 `cookieUtils` 和 `useAuthStore`。
- `main.ts` 每 24 小时 `location.reload()`；生产环境抑制 `console.log` / `dir` / `warn`。
- 顶级导航同时受路由和 `MemeCategory` 影响，增删主菜单要两边都改。

## 改动纪律

- 范围贴近请求，不做无关重构。有多种合理解法，或要动后端地址、鉴权、依赖、路由模式、大重构时，先问用户。
- 行为或项目知识变了，同步更新 `AI_GUIDE.md` 或对应用户文档。本文过时了就在同一次改动里改掉。

## Git

用户明确要求才提交。提交前确认版本三处一致，不要带上无关改动。message 用 Conventional Commits：`type: subject`，subject 用简短中文，格式跟仓库已有提交。一次一个主题。
