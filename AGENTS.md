# AGENTS.md

这份文件是给 AI coding agent 使用的项目级工作说明，适用于 Codex、Claude Code 或其他 CLI/IDE agent。处理本仓库任务时，优先遵守这里的长期约定；如果这里和当前源码冲突，以当前源码为准，并在必要时更新文档。

## 先读哪些文档

- 非简单改动前先读 `AI_GUIDE.md`。它是当前最完整的项目地图，包含接口、页面结构、响应式布局、状态管理和常见坑。
- 读 `README.md` 了解项目定位、官网地址、后端说明和版权声明。
- 改动已有功能、版本展示或用户可见能力时，参考 `docs/更新日志.md`。
- 修改代码或版本信息前读 `docs/版本策略.md`。它定义新版本格式、major/minor/patch 升级口径和第三版网站的历史版本溯源。
- 只有涉及油猴脚本说明页或第三方脚本文案时，才需要读 `docs/油猴脚本.md`。
- 跨多次对话的大改动先读 `docs/ai-plans/README.md`。正在执行的计划在 `docs/ai-plans/` 下；用户说按计划做或继续 goal 时，从该计划的「当前步骤」开始，不要另起一份平行方案。
- 文档与代码不一致时，以离改动最近的源码为最终依据。

## 项目概况

- 这是 `sb6657.cn` 的 Vue 前端项目，用于收集和展示斗鱼玩机器相关烂梗、弹幕、帖子、赛事和 AI 造梗内容。
- 后端不开源。不要凭空假设后端协议，优先从前端调用、响应处理和 `AI_GUIDE.md` 推断行为。
- 主要技术栈：Vue 3、Vite、TypeScript、Vue Router、Pinia、Element Plus、SCSS、Axios、ECharts wordcloud、Three.js、`html2canvas`、`html-to-image`。
- 路由使用 history 模式，`public/404.html` 和 `src/router/index.ts` 里的重定向逻辑用于支持静态站点直达子路由。
- Node 版本要求 `>=22.13.0`，包管理器统一使用 `pnpm@11.3.0`。GitHub Actions 使用 Node `22.x`、`pnpm install --frozen-lockfile`，并依次执行 lint、typecheck 和 build。
- 项目归属 `sb6657-cn` 组织。部署链路：源码仓库 workflow 构建 dist 后用 GitHub App 临时令牌（凭据在 Actions 的 `PAGES_APP_CLIENT_ID` / `PAGES_APP_PRIVATE_KEY`）推送到部署仓库 `sb6657-cn/sb6657-cn.github.io`，由 Pages 按 main 根目录 + CNAME 发布到 `sb6657.cn`；旧个人 PAT `ACCESS_TOKEN` 已废弃。
- 组织下旧版站点仓库（如 `v1.sb6657.cn`、`v2.sb6657.cn`）发布在 `sb6657.cn/<仓库名>/`；`sb6657oss.wishao.fun` 是独立 OSS 静态资源域名，与 GitHub Pages 迁移无关。

## 常用命令

- 安装依赖：CI 用 `pnpm install --frozen-lockfile`，本地刷新依赖用 `pnpm install`。
- 开发服务：`pnpm run dev`。
- 生产打包：`pnpm run build`。
- 预览打包结果：`pnpm run preview`。
- 代码检查：`pnpm run lint`。
- 自动修复 lint：`pnpm run lint:fix`。
- 类型检查：`pnpm run typecheck`。

验证要求：

- 修改代码后默认运行 `pnpm run lint`、`pnpm run typecheck` 和 `pnpm run build`，纯文档改动或有明确本地阻塞时可以不跑，但要说明原因。
- 当前 lint 使用 ESLint 9 flat config；历史代码仍可能输出 warning，但 error 会阻断 CI。
- 涉及 UI 的改动要同时考虑桌面端和移动端，并沿用被修改组件已有的断点。

运行与视觉验收边界：

- UI 实际运行和视觉效果由用户人工验收。除非用户在当前任务中明确要求，否则 AI 禁止运行 `pnpm run dev`、`pnpm run preview` 或其他用于启动项目和预览页面的命令。
- 除非用户在当前任务中明确要求，否则 AI 禁止自动打开或控制浏览器访问项目，禁止通过浏览器截图、录屏、像素对比等方式进行视觉验收。
- UI 改动默认使用代码审查、`pnpm run lint`、`pnpm run typecheck`、`pnpm run build` 等非交互方式验证；最终回复应说明未进行浏览器预览，并将实际页面效果留给用户人工确认。

## Repo Skills

- `.agents/skills/project-feature-flow`：实现功能、修 bug、重构、优化或 UI 改动时使用。它强调先读上下文、遇到模棱两可的问题先问用户，再进入实现、版本同步和验证。若任务对应 `docs/ai-plans/` 里一份 `active` 计划，按计划的当前步骤做，不要重新设计范围。
- `.agents/skills/project-commit`：用户明确要求提交代码时使用。它要求先检查变更范围、版本号和更新日志同步、pnpm 质量门禁，然后才能 stage 并 commit。

## 版本和更新日志

每次修改代码后，都要同步更新版本信息和更新日志。这是本项目的固定流程，不要等用户额外提醒。

- 先读取当前本地日期，不要凭记忆或上下文猜日期。
- 自 `V3.13.11.20260721` 起使用 `Vmajor.minor.patch.yyyymmdd`，完整规则和历史升级依据见 `docs/版本策略.md`；旧 `YY.MM.DD` 更新日志标题原样保留。
- 先按版本策略判断升级 major、minor 或 patch，再用实际发布日期填写 8 位 `yyyymmdd`。不要只因 commit message 使用 `feat` 就自动升级 minor。
- 同步更新三个位置，其 major、minor、patch 和日期必须一致：
    - `docs/更新日志.md`：新增 `## 版本【Vmajor.minor.patch.yyyymmdd】` 条目。
    - `package.json`：根字段 `"version"` 使用 SemVer 合法格式 `major.minor.patch+yyyymmdd`。
    - `src/apis/httpInstance.ts`：`sbVersion` 使用完整展示格式 `Vmajor.minor.patch.yyyymmdd`。
- `pnpm-lock.yaml` 不记录根包发布版本，不作为版本同步点；只有依赖声明或解析结果变化时才由 pnpm 更新，禁止手工写入发布版本。
- 一次任务或发布批次只升级一次；如果继续补充同一未发布批次，就在已有版本标题下追加内容。一天内发布多个独立批次时继续递增 patch，日期可以相同。
- 更新日志条目保持简短，沿用现有格式，如 `1、【新增】...`、`2、【优化】...`、`3、【修复】...`、`4、【修改】...`、`5、【重构】...`。
- 纯文档改动不强制更新版本号，除非用户明确要求或文档改动会影响用户可见发布内容。

## 代码风格

- 本项目优先追求人类可以连续读懂、放心修改的代码；AI 生成速度不构成接受巨型组件、职责混杂或压缩排版的理由。
- 遵守现有 Prettier/ESLint 偏好：4 空格缩进、空格不用 tab、单引号、分号、`printWidth: 200`、按配置保留尾随逗号。
- 保持 LF 换行和文件末尾换行。
- Vue 组件通常使用 `<script setup lang="ts">` 和 scoped SCSS；如果被修改文件风格不同，跟随局部风格。
- 新增的 Vue 单文件组件，以及本次任务进行实质重构的现有 Vue 组件，完成后单文件不得超过 300 行（`template`、`script`、`style` 合计）。接近上限时先按业务职责拆分，不用压缩排版、堆叠单行代码或牺牲可读性规避行数限制。
- 历史存量中超过 300 行、但不在当前任务范围内的组件不要求顺手重构；一旦纳入实质修改范围，应将它拆到 300 行以内。
- 页面私有的 Vue 子组件统一放在 `src/components/<页面或业务命名>/` 下，由路由页面负责数据编排，子组件负责边界清晰的展示和交互；不要只为缩短文件而制造无业务含义的透传组件。
- 不依赖 Vue 响应式、生命周期或组件上下文的可复用纯函数放在 `src/utils/`。
- 使用 Vue 响应式状态、生命周期或浏览器订阅的复用逻辑属于 composable，统一放在 `src/composables/`，使用 `useXxx` 命名；不要把 composable 称为 hooks，也不要继续放进 `src/utils/`。
- 完成 Vue 改动后，除 lint/build 外还要检查本次新增和实质修改的 `.vue` 文件行数，确认均不超过 300 行。
- 从 `src` 导入时优先使用 `@/*` 别名。
- 优先使用项目已有的 Element Plus 组件和 `@element-plus/icons-vue` 图标。
- 不要轻易新增生产依赖；确实需要时说明原因。
- 注释要短且有用，不给显而易见的代码写解释型注释。

## 目录和关键文件

- `src/main.ts`：应用入口，注册 Router、Pinia、Element Plus、全局样式、每日自动刷新和生产环境 console 抑制。
- `src/router/index.ts`：history 路由和 `MainLayout` 下的主页面路由。
- `src/constants/backend.ts`：后端地址、API 常量、侧边栏和移动端菜单 `MemeCategory`。
- `src/apis/httpInstance.ts`：Axios 实例、`siteToken`、`dpahjdoiaw`、token 刷新、错误处理，以及轻封装 `get`/`post`。
- `src/stores/`：Pinia store，包括标签、屏蔽词、登录弹窗/userId、斗鱼贵宾数。
- `src/composables/`：使用 Vue 响应式状态、生命周期或浏览器订阅的复用逻辑，例如 `useIsMobile()`。
- `src/utils/`：与 Vue 组件生命周期无关的通用纯函数。
- `src/views/MainLayout/`：全局布局、Header、右侧浮窗和主要页面。
- `src/components/`：全局可复用组件，以及按页面/业务命名目录收纳的页面私有子组件，如桌面侧边栏、移动端顶部 Tab、标签选择器、投稿弹窗、搜索、聊天室、硬币预览、词云和首页组件。
- `src/assets/css/index.scss`：Element Plus 主题变量。
- `src/assets/css/global.css`：全局 reset 和共享样式。
- `docs/ai-plans/`：跨会话 AI 实施计划；规范见该目录 `README.md`，正在推进的深色模式收口见 `dark-mode.md`。

## 请求和后端约定

- `SERVER_ADDRESS` 优先读取 `VITE_BASE_URL`，默认回退到 `https://hguofichp.cn:10086`。
- `httpInstance.get/post` 返回的是后端 body，即 `{ code, data, msg }`，不是原始 AxiosResponse。
- 调用 `httpInstance.get<T>`、`post<T>` 等实例方法时，泛型 `T` 表示后端返回体的 `data` 字段类型；未声明时默认为 `unknown`，需要读取 `data` 的调用必须补业务类型。
- `httpInstance.ts` 导出的轻封装 `get`/`post` 返回 `{ _failure, flatData }`。
- 请求拦截器会加：
    - `siteToken`：匿名站点统计。
    - `dpahjdoiaw`：官网 Web 前端来源统计。
    - `Authorization: Bearer ...`：登录 token。
- `dpahjdoiaw` 不是鉴权密钥。不要把它复制到 QQ bot、agent、油猴脚本、第三方客户端、文档示例或任何非官网 Web 前端调用里。
- AI 流式聊天使用原生 `fetch`，不是 `httpInstance`；除非明确改 AI 会话逻辑，否则保留它手动拼 base URL 和 token 的方式。
- 很多旧接口没有集中在 `API` 常量里，而是直接写在组件中。判断接口是否使用前要全局搜索。

## UI 和响应式约定

- 本项目桌面端和移动端布局差异明显，不要只按桌面端修 UI。
- 现有常见断点包括 `600px`、`601px`、`768px`、`1200px`、`375px`、`360px`。
- `src/composables/useIsMobile.ts` 的 `useIsMobile()` 使用 `(max-width: 600px)`，它不一定等于组件 CSS 中的 `768px` 断点。
- `MainLayout.vue` 负责全局壳和组件编排，并通过 `v-if` 挂载桌面侧边栏或移动端横向 Tab；`desktop-sidebar.vue`、`mobile-top-tabs.vue` 不再自行判断设备。
- `header-bar.vue` 只负责根据 `useIsMobile()` 挂载桌面或移动 Header；双端模板和样式分别维护在 `desktop-header.vue`、`mobile-header.vue`，共享业务继续下沉到 Header 子组件，桌面 Header 的吸顶定位由 `MainLayout.vue` 负责。
- `MainLayout.vue` 只挂载一个 `global-dialog-host.vue` 作为全局单例弹窗宿主；新增跨页面弹窗时集中挂到该宿主，并为各业务弹窗使用独立 Pinia store 管理开关，不要在多个入口重复创建弹窗实例。
- `FloatingSidebar.vue` 里有拖拽定位必需的动态 `:style`，不要在普通样式清理中删除。
- 修改 Element Plus 的弹窗、popover、table 或 teleport 内容时，优先给弹层内容加明确 root class；scoped 样式打不到时使用 `:deep()`。
- 清理历史行内样式时，一次只处理一个组件，迁移到语义 class，避免顺手大重构。

## 功能注意事项

- 标签通过 `memeTags` store 异步加载，页面首次渲染时不要假设标签已经存在。
- 屏蔽词通过 `shieldWordStore` 缓存，并用于烂梗列表和搜索结果风险标记。
- 后端返回的 `tags` 字段常是逗号分隔字符串，不是数组。
- 登录态和 token 存取经由 `cookieUtils` 与 `useAuthStore`。
- `main.ts` 每 24 小时自动 `location.reload()`，生产环境会抑制 `console.log`、`console.dir` 和 `console.warn`。
- 顶级导航同时受路由和 `MemeCategory` 影响；新增或移除主菜单页面时，两边都要检查。
- GitHub Actions 对 Markdown-only 改动配置了忽略，不会触发部署。

## 改动纪律

- 改动范围要贴近用户请求，不做无关重构。
- 优先复用已有工具函数、store、组件模式和 Element Plus 写法。
- 未经明确要求，不要修改生产后端默认地址、环境文件、部署 workflow 或路由模式。
- 不要修改生成物或依赖目录，例如 `dist/`、`.pnpm-store/`、`node_modules/`、`tsconfig.node.tsbuildinfo`。
- 如果改动影响已记录的接口、路由或重要功能行为，同时更新 `AI_GUIDE.md` 或相关用户文档。
- 如果本文件中的约定已经不符合项目现状，要在同一次改动中更新 `AGENTS.md`；如果不确定该怎么改，要在最终回复中提醒用户这份文件可能需要演进。
- 代码改动必须遵守“版本和更新日志”流程，同步 `docs/更新日志.md`、`package.json` 和 `src/apis/httpInstance.ts` 里的 `sbVersion`。

## Git 提交规范

- 如果用户要求提交代码，commit message 使用 Conventional Commits 风格：`type: subject`。
- 常用 `type`：
    - `feat`：新增功能。
    - `fix`：修复 bug。
    - `docs`：文档变更。
    - `style`：格式、样式或不影响逻辑的调整。
    - `refactor`：重构，不新增功能也不修 bug。
    - `perf`：性能优化。
    - `test`：测试相关。
    - `build`：构建、依赖或打包配置。
    - `ci`：CI/CD 配置。
    - `chore`：杂项维护。
- `subject` 优先使用简短中文说明本次变更；只有技术术语或生态约定用英文更清晰时才使用英文。优先一句话说清结果，例如 `feat: 添加屏蔽词投稿入口`、`fix: 修复移动端搜索弹窗溢出`、`docs: 更新 agent 工作说明`。
- 每次提交尽量只包含一个主题；提交前检查 `git status` 和 diff，不要把无关改动混进同一个 commit。
- 如有破坏性变更，使用 `type!:` 或在提交正文写 `BREAKING CHANGE:`，并在最终回复里明确提醒。

## 完成标准

- 实现符合用户请求和当前项目约定。
- 行为或项目知识变化时，相关文档已更新。
- 代码改动后，更新日志、`package.json` 版本和 `sbVersion` 已按 `docs/版本策略.md` 与当天日期同步；纯内部文档改动除外。
- `pnpm run lint`、`pnpm run typecheck` 和 `pnpm run build` 已通过，或已说明未运行/未通过的原因。
- 如果 lint 仍有 warning，区分本次改动引入的问题和历史技术债。
- UI 改动已从代码层面考虑桌面端和移动端，实际运行和视觉效果留给用户人工验收，剩余风险要说清楚。
