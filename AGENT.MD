# AGENT.MD · AI 开发规范（待办事项应用）

> **先读本文件，再动手写代码。**
> 事实来源优先级：`需求调研.md` / `PRD.md`（产品口径）> `TECH_DESIGN.MD`（技术设计）> 本文件（执行约束）。冲突时以上游为准，不得自行发挥。
> V1.0 · 2026-11-14

---

## 1. 项目概述

- **产品**：无需注册、单页、即开即用的个人待办清单，桌面与手机双端；闭环为「创建 → 组织 → 完成 → 查找 → 复盘」。
- **架构**：纯前端 SPA，业务逻辑与数据全在浏览器内；构建产物为静态文件；无账号、无 API、无运行时网络请求，断网可用；设计容量 ≤ 1000 条任务。
- **技术栈**：React 18 + TypeScript(strict) + Vite 5 + Tailwind CSS 3（CSS 变量设计令牌）+ Zustand 4 `persist`；`date-fns`、`lucide-react`；Vitest + React Testing Library；静态托管（`dist/`）。
- **后端 / 数据库**：**均不设**。`localStorage` 单键 `todoapp.state.v1` 即数据层，持久化由 Zustand `persist` 承担；静态托管只下发文件，不是后端。
- **范围**：V1.0 只做 PRD 功能 1–10 + 界面规范 + 本地持久化。**不做**账号、云同步、提醒、协作、图表、深色模式、多语言、排序拖拽、撤销删除、自定义分类、子任务 / 标签。V1.1 / V2.0 条目未经明确指令不得提前实现。
- **依赖白名单**（新增依赖须先说明理由）：runtime `react`、`react-dom`、`zustand`、`date-fns`、`lucide-react`；dev `vite`、`typescript`、`@vitejs/plugin-react`、`tailwindcss`、`postcss`、`autoprefixer`、`vitest`、`jsdom`、`@testing-library/react`、`eslint`、`prettier`。**禁止引入** UI 组件库、路由、HTTP 客户端、后端框架、数据库驱动、其他状态库、在线字体 / 图标 CDN。

---

## 2. 开发规范

### 2.1 目录与分层
- 目录按 `TECH_DESIGN.MD` 第 2 章落地；新增文件放对应层，不在 `src/` 根目录堆逻辑。
- 依赖单向：`types`/`constants` → `lib` → `store` → `hooks` → `components`。
- `lib/*` 不得 import React 或 store；`storage.ts` 仅做存储编解码与容错，不持有状态。
- 组件**禁止**直接读写 `localStorage`、**禁止**在组件内计算统计值；一律走 store action → `useDerivedTodos`。

### 2.2 状态与数据流
- 唯一可变状态在 `store/useTodoStore.ts`；actions：`add` / `update` / `toggle` / `remove` / `setFilter` / `setKeyword`。
- 流程：用户事件 → action → state 更新 → `persist` 写 `localStorage`（try/catch）→ `useMemo` 单次遍历派生可见任务与统计 → 重渲染（`React.memo(TodoItem)`）。
- 落盘只存 `{ version, tasks, preferences }`；派生数据（`visibleTasks`、`stats`）**不落盘**；`version` 当前为 `1`，结构变更走 `migrate[fromVersion]` 链。
- 状态不变量（改动任务逻辑后必须复核）：
  1. `completed === true` ⟺ `completedAt !== null`；
  2. `id` 唯一（`crypto.randomUUID()`）、`title` trim 后 1–100 字符、`description` ≤ 500 字符；
  3. `stats.total === tasks.length`，`rate = total ? round(completed / total * 100) : 0`；
  4. 编辑 / 勾选不改变 `tasks` 元素顺序（用 `map` 原地替换，禁止 `sort` / `filter` 重建），列表 `key={task.id}`。

### 2.3 业务规则（PRD 2.3，正确性底线）
- 统计恒按**全部任务**计算，不随筛选 / 搜索变化；筛选与搜索只影响列表视图。
- 已完成任务**不可编辑**（UI 隐藏入口 + store 层 `updateTask` 二次校验），但可取消完成、可删除。
- 分类 × 优先级 × 状态三维 AND；与关键词搜索叠加仍为 AND；搜索匹配标题 + 描述、不区分大小写、防抖 250ms；支持一键清除。
- 删除 / 放弃编辑走二次确认（含任务名、注明不可撤销）；无「保存」按钮，变更即时持久化。
- 新建任务插入列表顶部；默认排序 `createdAt` 倒序，同毫秒用 `id` 兜底。

### 2.4 存储、日期、界面
- 存储读写全链路 `try/catch`：解析失败或 `version` 未知 → 备份原值到 `todoapp.state.broken.<ts>` → 返回空状态并提示；枚举缺失回落默认值、丢弃非法 Task；`QuotaExceeded` / 隐私模式 → 内存态 + 非阻断提示；`filters` / `keyword` 损坏直接回落默认值。
- 日期统一 `YYYY-MM-DD` 字符串存储与比较（字典序即时间序），展示用 `parseISO` + `format`；**禁止** `new Date('2026-11-14')` 解析日期、禁止跨时区换算；`dueDate` 允许过去日期。
- 视觉令牌集中在 `styles/tokens.css` 与 `tailwind.config.ts`：主色 `#3B82F6`（hover `#2563EB`），圆角 8 / 12 / 9999px，断点 640 / 1024px，触控目标 ≥ 44×44px，移动端底部抽屉 + `env(safe-area-inset-bottom)`；组件内不硬编码色值。
- 模态 `role="dialog"` + `aria-modal` + 焦点陷阱 + Esc 关闭 + 关闭归还触发元素；统计区 `aria-live="polite"`；图标按钮 `aria-label` 带任务名；编辑 / 删除按钮常显，不依赖 hover。

### 2.5 验证命令（交付前必跑，全绿才算完成）
```bash
npm run typecheck   # tsc --noEmit, strict
npm run lint        # eslint
npm run test        # vitest run
npm run build       # vite build → dist/
```
- 若 `package.json` 尚未建立，先按依赖白名单与上述 scripts 初始化工程，再实现功能。
- 每完成一个模块立即跑 typecheck + 该模块单测，禁止堆积未验证代码。

---

## 3. 测试要求

- 框架：Vitest + jsdom + React Testing Library；以纯函数（`stats` / `filter` / `storage` / `date`）与 store 为测试主体，组件覆盖关键交互。
- 测试放 `src/__tests__/`，命名 `*.test.ts(x)`，与被测模块同名。
- **必测用例（不得省略）**：
  1. 空列表完成率 `0%`、全完成 / 全未完成；
  2. 统计不随筛选 / 搜索变化；
  3. 三维 AND 组合及与关键词叠加；
  4. 非法 JSON、未知 `version`、`QuotaExceeded` 的读取降级与备份；
  5. 已完成任务编辑守卫（UI 与 store 双重）；
  6. 勾选 / 编辑后顺序不变；
  7. 日期跨月末展示、`dueDate` 过去日期；
  8. `completed` 与 `completedAt` 一致性、删除二次确认。
- 用 `getByRole` / 可见文本断言，顺带校验 a11y 角色；不测实现细节、不做大段 DOM 快照。
- 人工走查（AI 无法自动验证的，须在交付说明中列明）：375 / 768 / 1440px 三档、断网刷新、全键盘流程、清除浏览器数据后的首次提示。
- 不允许用 `.skip`、删除断言、放宽阈值让测试「通过」。

---

## 4. 代码风格

- TypeScript `strict: true`；禁止 `any`、`@ts-ignore`、非空断言滥用；枚举一律用 `Priority` / `Category` 联合类型，不写魔法字符串。
- 命名：组件 / 类型 PascalCase，hooks `useXxx`，变量与函数 camelCase，常量 UPPER_SNAKE_CASE；文件名与导出一致；布尔值用 `is` / `has` / `should` 前缀。
- 组件：函数组件 + 显式 Props 类型；`TodoItem` 用 `React.memo`；回调引用稳定；单文件超过约 150 行考虑拆分。
- 样式：Tailwind 工具类为主，设计值走 `tokens.css` 的 CSS 变量；动效 150–250ms 且仅用于状态反馈，遵循 `prefers-reduced-motion`。
- 格式化：ESLint + Prettier，无 warning；不改与任务无关的文件；不留 `console.log`、TODO 占位实现、死代码。
- 注释精简：只在非直觉逻辑（迁移容错、统计口径、时区处理）写一行「为什么」，不做逐行解释。
- 安全：用户输入一律经 React 文本节点渲染；**禁止** `dangerouslySetInnerHTML`、`innerHTML`、`eval`；描述超长用 CSS 截断。

---

## 5. 注意事项

- ❗ **不要引入任何后端 / API / 数据库 / 账号 / 云同步代码**，也不要顺手加 SSR、路由、状态库替换或 UI 组件库。
- ❗ **不要破坏离线能力**：不加载在线字体、图标、统计脚本；依赖全部本地打包；`dist/` 为纯静态、无前端路由（无需 rewrite 规则）。
- ❗ **数据仅存当前浏览器**，清除浏览器数据即丢失：首次使用须在 UI 告知「数据仅存本机」；存储不可用时降级并提示，不得静默失败或白屏。
- ❗ **多标签页并发写入**：V1.0 接受「后写覆盖先写」并注明，不实现 `storage` 事件合并（属 V1.1）；`updatedAt` 仅作预留字段。
- ❗ **优先级**：存储容错 → 统计口径隔离 → 日期字符串 → 列表位置与编辑权限，是正确性底线；防抖、`memo`、a11y、触控随组件开发同步落地，不得以后补为由省略。
- ❗ 修改 `Task` / `PersistedState` 结构必须同步 `version` 与 `migrate`，并更新 `TECH_DESIGN.MD` 第 3 章；禁止擅自改字段默认值与统计口径。
- ❗ `PRD.md` 尾部存在局部乱码字符；口径不明时以 `TECH_DESIGN.MD` 与 `需求调研.md` 为准并向用户确认，不要基于乱码推断需求。
- ❗ 功能或结构变更后同步更新 `TECH_DESIGN.MD`；`需求调研.md` 与 `PRD.md` 属产品输入，未经要求不得改动。
