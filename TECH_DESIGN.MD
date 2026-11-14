# 待办事项应用 · 技术设计文档（TECH_DESIGN）

> V1.0 · 2026-11-14 · 对应 `PRD.md` V1.0 · 读者：前端开发 / 测试

---

## 1. 技术栈选择

**架构一句话**：纯前端单页应用，业务逻辑与数据都在浏览器内，构建产物为静态文件；无账号、无 API、无运行时网络请求，断网可用，设计容量 ≤ 1000 条任务。

### 1.1 市场主流方案与 V1.0 选型

| 层次 | 当前市场主流 | V1.0 选型 | 理由 |
| --- | --- | --- | --- |
| **前端** | React 18 / Vue 3 / Svelte + TypeScript + Vite；Tailwind 或 CSS Modules；Zustand / Pinia / Redux Toolkit | **React 18 + TypeScript(strict) + Vite 5 + Tailwind CSS 3（CSS 变量设计令牌）+ Zustand 4 `persist`** | 需求核心是「列表状态流转 + 派生数据」，`useMemo` 表达筛选/统计最直接；TS 锁死枚举与统计口径；`persist` 自带序列化、`version` 迁移与容错 |
| **后端** | Node.js（NestJS / Express）、Java Spring Boot、Python FastAPI；REST + JWT | **不设应用后端**，仅静态托管（Vercel / Netlify / GitHub Pages / COS / Nginx） | V1.0 无账号、无云同步、无协作、无服务端计算；引入后端会带来鉴权与网络依赖，与「打开即用、断网可用」冲突；静态托管只下发文件，不算后端 |
| **数据库** | PostgreSQL / MySQL / MongoDB；轻量场景 SQLite | **不设独立数据库**，`localStorage` 单键 KV（键 `todoapp.state.v1`）承担持久化 | 单用户、≤ 1000 条、纯结构化记录，浏览器原生 KV 足够；Zustand `persist` 即本项目的数据层 |
| 工具与测试 | date-fns / dayjs、图标库、Vitest / Playwright | `date-fns` + `lucide-react`（本地打包）、Vitest + React Testing Library + ESLint + Prettier | 纯函数与 store 可单测；不引第三方 CDN |
| 部署 | 容器 / 云函数 / 静态托管 | `vite build` → `dist/` 静态托管 | 零运维、无需 Node 运行时、产物带 hash 文件名 |

依赖：`react`、`react-dom`、`zustand`、`date-fns`、`lucide-react`；devDependencies：`vite`、`typescript`、`@vitejs/plugin-react`、`tailwindcss`、`postcss`、`autoprefixer`、`vitest`、`jsdom`、`@testing-library/react`、`eslint`、`prettier`。不引入 UI 组件库（只需按钮 / 输入 / 下拉 / 模态 / Toast 五类）。

**边界与演进**：数据仅存当前浏览器，清除浏览器数据即丢失，需在 UI 告知（PRD 2.3 规则 5），V1.1 用导出/导入兜底。若 V2.0 启动账号与多端同步，主流组合为 **Node.js + NestJS（REST + JWT）+ PostgreSQL**（或 Supabase 等 BaaS 的托管 PostgreSQL）：本地 `Task` 增 `userId` / `revision` 作增量同步游标，冲突默认 last-write-wins，`localStorage` 退化为离线缓存，`lib/` 纯函数原样复用，仅替换 store 的持久化适配器。

---

## 2. 项目结构

```
todo-app/
├── index.html
├── package.json
├── tsconfig.json                 # strict: true
├── vite.config.ts
├── tailwind.config.ts            # 设计令牌（色板 / 圆角 / 阴影）
├── .eslintrc.cjs / .prettierrc
└── src/
    ├── main.tsx                  # 挂载入口
    ├── App.tsx                   # 页面骨架：Header / 统计 / 工具栏 / 列表
    ├── types/todo.ts             # Task / Priority / Category / Filters / PersistedState
    ├── constants/options.ts      # 枚举与展示文案映射
    ├── store/useTodoStore.ts     # Zustand：state + actions + persist 配置
    ├── lib/                      # 纯函数，不依赖 React / store
    │   ├── storage.ts            # localStorage 读写、容错、schema 迁移
    │   ├── stats.ts              # 四项统计
    │   ├── filter.ts             # 三维筛选 + 关键词搜索
    │   └── date.ts               # YYYY-MM-DD 格式化与展示
    ├── hooks/                    # useDebounce(250ms) / useDerivedTodos(useMemo)
    ├── components/               # Header、StatCards、Toolbar(SearchBar / FilterBar)、
    │                             # TodoList / TodoItem、TodoFormModal、ConfirmDialog、
    │                             # EmptyState、Toast、ui/(Button / Input / Tag / Checkbox)
    ├── styles/                   # tokens.css（PRD 4.2 CSS 变量）+ index.css
    └── __tests__/                # stats / filter / storage / store 单测
```

**分层与依赖方向**：`types`/`constants`（无依赖）→ `lib`（纯计算，只依赖 types）→ `store`（唯一可变状态 + 持久化）→ `hooks`（派生数据 / 防抖）→ `components`（渲染与事件派发）。规则：`lib` 不得反向依赖 `store` 或 React；组件不得直接读写 `localStorage`，不得在组件内计算统计值。

**数据流**：用户事件 → `store.action`（add / update / toggle / remove / setFilter / setKeyword）→ state 更新 → `persist` 写入 `localStorage`（try/catch）→ `useDerivedTodos` 用 `useMemo` 单次遍历得到可见任务与统计值 → 组件重渲染（`React.memo(TodoItem)`）。统计输入恒为 `state.tasks` 全量，与筛选/搜索物理隔离，保证 PRD 2.3 规则 1 不被误改。

---

## 3. 数据模型

### 3.1 TypeScript 定义

```ts
// src/types/todo.ts
export type Priority = 'high' | 'medium' | 'low';
export type Category = 'work' | 'life' | 'study' | 'other';
export type FilterValue<T> = 'all' | T;

export interface Task {
  id: string;                    // crypto.randomUUID()
  title: string;                 // trim 后 1–100 字符，必填
  description: string;           // ≤ 500 字符，默认 ''
  dueDate: string | null;        // 'YYYY-MM-DD' | null，默认 null
  priority: Priority;            // 默认 'medium'
  category: Category;            // 默认 'other'
  completed: boolean;            // 默认 false
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  completedAt: string | null;    // 完成时写入，取消完成清空
}

export interface Filters {
  category: FilterValue<Category>;
  priority: FilterValue<Priority>;
  status: 'all' | 'active' | 'completed';
}

export interface PersistedState {
  version: number;               // 当前 1，用于 schema 迁移
  tasks: Task[];
  preferences: {
    filters: Filters;
    keyword: string;
  };
}
```

### 3.2 存储结构与约束

- 单键 `todoapp.state.v1`，值为 `JSON.stringify(PersistedState)`；示例：`{"version":1,"tasks":[{"id":"9f1c2a7e-…","title":"完成技术设计文档","dueDate":"2026-11-16","priority":"high","category":"work","completed":false,"completedAt":null}],"preferences":{"filters":{"category":"all","priority":"all","status":"all"},"keyword":""}}`。
- 派生数据（`visibleTasks`、`stats`：total / active / completed / rate）**不落盘**，只存原始数据与偏好，避免派生值与源数据不一致。
- 默认排序 `createdAt` 倒序，同毫秒用 `id` 兜底；`dueDate` 允许过去日期，按 `YYYY-MM-DD` 字符串字典序比较；`completedAt` 为 V2.0 趋势统计预留。
- 读写全链路 `try/catch`：JSON 解析失败或 `version` 未知时先把原值备份到 `todoapp.state.broken.<ts>` 再返回空状态并提示；缺失枚举回落默认值、丢弃非法 Task；`QuotaExceeded` / 隐私模式降级内存态 + 非阻断提示；迁移用 `migrate[fromVersion]` 链式执行。`filters` / `keyword` 属偏好，损坏时直接回落默认值。
- 状态不变量：`completed === true` ⟺ `completedAt !== null`；`id` 唯一且 `title` 非空；`stats.total === tasks.length`、`rate = total ? round(completed / total * 100) : 0`；编辑 / 勾选不改变 `tasks` 中的元素顺序。

---

## 4. 关键技术点

| # | 难点 | 处理方案 |
| --- | --- | --- |
| 1 | 无后端下的持久化可靠性 | `storage.ts` 全链路 try/catch；损坏值先备份再降级空状态；配额超限 / 隐私模式降级内存态并提示；`version` + `migrate` 预留 |
| 2 | 统计口径与筛选耦合 | 统计与筛选拆成两个纯函数，统计输入恒为 `state.tasks` 全量；分母为 0 返回 `0`；空 / 全完成 / 全未完成写单测 |
| 3 | 日期时区偏移 | 存储与比较全用 `YYYY-MM-DD` 字符串（字典序即时间序），避免 `new Date('2026-11-14')` 按 UTC 解析；展示用 `parseISO` + `format`，不做跨时区换算 |
| 4 | 列表位置与编辑权限 | action 用 `map` 原地替换而非 `sort`/`filter` 重建，`key={task.id}`；编辑入口由 `!completed` 渲染守卫，store 层 `updateTask` 再次校验 |
| 5 | 搜索 / 筛选性能 | `useDebounce(keyword, 250)`；`useMemo` 一次遍历完成三维 AND + 关键词匹配；`React.memo(TodoItem)` + 稳定回调；1000 条内无需虚拟滚动 |
| 6 | 模态框与键盘可访问性 | `role="dialog"` + `aria-modal` + 焦点陷阱；打开聚焦首个输入、Esc 关闭、关闭归还触发元素；原生 checkbox + `label`；统计区 `aria-live="polite"`；图标按钮 `aria-label` 带任务名 |
| 7 | 移动端输入与触控 | 底部抽屉内可滚动 + `visualViewport` 适配软键盘；`env(safe-area-inset-bottom)`；触控目标 ≥ 44×44px；编辑 / 删除按钮常显不依赖 hover |
| 8 | XSS 与静态部署离线 | 用户输入全部经 React 文本节点渲染，禁用 `dangerouslySetInnerHTML` / `innerHTML`；系统字体栈 + 图标打包进 bundle + 无前端路由（无需 rewrite 规则），断网刷新可用 |
| 9 | 多标签页并发写入 | V1.0 接受「后写覆盖先写」并注明；V1.1 监听 `storage` 事件合并 / 提示刷新；`updatedAt` 为冲突判定预留 |

优先顺序：1 → 4 是正确性底线，5–9 属体验与工程质量，随组件开发同步落地。

**验证**：`npm run typecheck`（tsc --noEmit, strict）、`npm run lint`、`npm run test`（vitest run）、`npm run build`（vite build → dist/）。必测用例：空列表完成率、非法 JSON 读取、三维 AND 组合、已完成任务的编辑守卫、勾选后顺序不变、日期跨月末展示；人工走查 375 / 768 / 1440px 三档与断网刷新。
