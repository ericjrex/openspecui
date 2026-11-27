# Design

## Context

参见 [proposal.md](./proposal.md) 的变更动机。当前前端使用 React 19.3.1、Vite 6.4.6、Tailwind CSS 4.3.5，没有 `components.json`、`@/*` 别名和前端测试体系。主题由 `packages/web/src/index.css` 的通配覆盖规则实现，业务组件包含大量原生控件与手写弹窗。

视觉常量的权威记录位于 [specs/frontend-ui-system/spec.md](./specs/frontend-ui-system/spec.md)。所有颜色、圆角、间距、字号、布局和效果实现必须引用该文件及其来源，不得重新估算。

## Goals / Non-Goals

**Goals:**

- 在 `packages/web` 内建立 shadcn/ui 组件体系。
- 使用语义 Design Token 同时支持浅色与深色主题。
- 将业务组件拆分为可测试的领域组件。
- 使用 Vitest 覆盖单元、集成和可视化回归。
- 保留现有业务行为、数据契约和视觉密度。
- 提升键盘操作、焦点管理、表单语义和拖拽可访问性。

**Non-Goals:**

- 不修改服务端 API、共享类型、OpenSpec 解析、Git 操作、任务回写和文件监听。
- 不新增页面、路由、命令面板或全局 Toast。
- 不创建独立的 UI workspace 包。
- 不改变现有信息架构和业务功能。
- 不使用 Git 回滚命令恢复代码。

## Decisions

### 1. shadcn/ui 安装在 Web Workspace 内

在 `packages/web` 运行 shadcn CLI，使用 `@shadcn` registry、Radix 组件底座、Nova 样式和 CSS variables。CLI 命令统一带 `-c packages/web`，避免 monorepo 根目录歧义。

配置内容包括：

- `packages/web/components.json`。
- `packages/web/tsconfig.json` 的 `@/*` 路径别名。
- `packages/web/vite.config.ts` 的运行时别名。
- `packages/web/src/lib/utils.ts` 的 `cn` 工具。
- `packages/web/src/components/ui/` 的生成组件。

首批组件：

```text
button input textarea label select checkbox
dialog alert-dialog tabs toggle-group card badge
separator progress scroll-area tooltip table alert
empty skeleton collapsible field input-group
spinner item button-group
```

组件继续保存在 `packages/web`。独立 UI 包会增加构建、导出和 Tailwind 扫描配置，当前只有一个前端应用，收益不足。

### 2. 使用语义令牌替换颜色覆盖规则

`packages/web/src/index.css` 采用以下结构：

- `@import "tailwindcss"` 与 shadcn 所需样式导入。
- `@custom-variant dark (&:is(.dark *))`。
- `@theme inline` 将 CSS 变量映射为 Tailwind 工具类。
- `:root` 保存浅色令牌。
- `.dark` 保存深色令牌。
- 基础层只设置字体、`color-scheme`、边框和页面背景文字。

基础圆角令牌设置为 `0.5rem`，来源为现有 `rounded-lg`。颜色与尺寸直接使用规范表格中的值。迁移完成后删除 `html.theme-light`、`[class*="bg-slate-*"]` 和相关 `!important` 规则。

`packages/web/index.html` 在 React 挂载前读取 `openspecui-theme` 并设置 `dark` 类。主题 Hook 继续默认深色，只提供浅色与深色两种状态。

### 3. 业务组件按领域拆分

| 目录 | 职责 |
| --- | --- |
| `src/components/ui/` | shadcn 生成的基础组件 |
| `src/components/layout/` | 应用外壳、顶部工作区栏、主视图页签、只读横幅 |
| `src/components/workspace/` | 工作区弹窗、目录选择器、工作区切换 |
| `src/components/board/` | 看板、仓库筛选、阶段列、归档、Specs、Ideas、跨仓组 |
| `src/components/change-detail/` | 详情 Dialog、产物页签、双仓对照、Git 关联面板 |
| `src/components/git/` | 仓库状态卡、分支选择、同步、提交时间线 |
| `src/components/markdown/` | Markdown 渲染、任务复选框、文档样式 |
| `src/components/diff/` | Unified/Split Diff 与差异样式 |
| `src/components/history/` | Spec 历史、贡献者和 Requirement 变更 |
| `src/components/common/` | 状态标签、空状态、提示条、进度、图标按钮 |
| `src/lib/` | `cn`、阶段常量、状态映射、仓库颜色 |
| `src/hooks/` | 主题、工作区数据和异步状态 |

`App.tsx` 只保留页面组合、顶层状态和弹窗编排。现有 API 客户端与业务工具函数保持原路径或等价迁移，不改变调用契约。

### 4. 使用 @dnd-kit 统一拖拽

引入 `@dnd-kit/core`、`@dnd-kit/sortable` 和 `@dnd-kit/utilities`，替换仓库卡、Idea、Change 卡和跨仓组的原生 HTML5 拖拽。

- 使用 Pointer Sensor 支持鼠标与触控。
- 使用 Keyboard Sensor 支持键盘排序。
- 拖拽手柄与卡片打开按钮分离，避免嵌套交互元素。
- 排序结果继续调用现有 `PUT /api/workspaces/:id/order`。
- 只读模式禁用传感器与持久化。
- 禁止跨生命周期阶段拖拽。

### 5. 弹窗与表单使用 Radix 行为

所有覆盖式弹窗迁移为受控 `Dialog`。删除 `useEscapeKey.ts`，由 Dialog 栈处理 Esc、焦点约束、背景隔离和焦点恢复。

破坏性操作使用 `AlertDialog`。远程仓库解绑提供“取消”“仅解绑”“解绑并清理缓存”三个明确动作。

表单使用 `Field`、`Label`、`Input`、`Textarea`、`Select` 和 `Checkbox`。Select 的空选项使用内部哨兵值，在提交时转换回现有 API 所需值。错误提示使用 `FieldError` 或 `Alert`，不得只依赖颜色。

### 6. Markdown 与 Diff 保留领域逻辑

继续使用 `react-markdown` 和 `remark-gfm`，不启用原始 HTML 渲染。

- 保留 AST 行号到任务项的映射。
- Markdown 任务复选框替换为 shadcn `Checkbox`。
- 表格使用 shadcn `Table` 基础组件。
- 双仓视图按仓库生成唯一标题 ID。
- 锚点跳转同时移动焦点并滚动。
- Diff 行生成算法保持不变。
- Unified/Split 切换使用 `ToggleGroup`。
- Diff 背景与文字使用规范中的语义令牌。

### 7. Vitest 使用三个测试项目

`packages/web/vitest.config.ts` 使用 `defineConfig` 和 React 插件，通过 `test.projects` 划分：

| 项目 | 文件匹配 | 环境 | 用途 |
| --- | --- | --- | --- |
| `unit` | `**/*.unit.test.ts` | `node` | 主题、令牌映射、状态变体、归档排序、Diff 行生成 |
| `integration` | `**/*.integration.test.tsx` | `jsdom` | 真实组件渲染、用户交互、键盘、只读状态 |
| `vrt` | `**/*.vrt.test.tsx` | Browser Mode + Playwright Chromium | 浅色/深色、桌面/移动、弹窗、Markdown、Diff、空状态截图 |

集成测试配置 `vitest.setup.ts`，导入 `@testing-library/jest-dom/vitest`，使用 Testing Library 和 user-event。测试数据使用类型完整的代表性数据，不用伪造组件实现或绕过真实逻辑。

可视化回归使用 `@vitest/browser-playwright` 和 `toMatchScreenshot`。固定视口为 `1440×900` 与 `390×844`，测试前设置主题、字体和动画状态。像素差异阈值初始设置为 `1%`，基线更新必须人工确认。

根 `package.json` 增加前端测试脚本，分别支持三个项目与完整运行。

### 8. 文档记录组件与令牌约束

新增 `docs/frontend-ui.md`，记录：

- 规范表格中的令牌来源。
- shadcn 组件选择规则。
- 公共业务组件职责。
- 主题切换与存储键。
- 可视化回归更新流程。
- 禁止使用通配主题覆盖、直接颜色类和手写通用控件。

## Risks / Trade-offs

- **[Risk] 令牌迁移遗漏原始颜色类** → 使用源码搜索与截图基线检查，业务组件只允许语义令牌，Diff 与 Markdown 使用专用令牌。
- **[Risk] Radix Portal 与全屏详情层级冲突** → 为 Dialog、Select、Tooltip 和 AlertDialog 建立统一层级测试，嵌套弹窗纳入集成测试。
- **[Risk] Markdown AST 行号映射在组件替换后失效** → 保留节点位置读取逻辑，增加本地仓、远程只读和并发冲突测试。
- **[Risk] @dnd-kit 改变现有排序手感或持久化顺序** → 对照现有拖拽场景测试鼠标、触控、键盘和只读模式，保持 API 不变。
- **[Risk] 跨操作系统字体渲染导致截图波动** → 固定视口、字体栈、动画和测试数据，差异阈值结合人工复核。
- **[Risk] shadcn CLI 更新覆盖本地定制** → 通用定制集中在 `cn`、语义令牌和公共组件，领域组件不依赖生成组件内部结构。
- **[Risk] Select 空值与只读状态回归** → 使用哨兵值转换，并为空选项、禁用状态和提交数据增加测试。

## Migration Plan

1. 捕获现有页面的浅色/深色、桌面/移动截图和关键交互基线。
2. 初始化 shadcn/ui、别名、基础令牌和 Vitest 三个测试项目。
3. 迁移主题系统、应用外壳、顶部栏和全局状态组件。
4. 迁移工作区、Idea、目录选择和确认弹窗。
5. 迁移 Change 看板、归档、Specs、Ideas、跨仓组和拖拽。
6. 迁移 Change 详情、Markdown、Tasks 和 Diff。
7. 迁移 Git 活动、仓库状态和 Spec 历史。
8. 删除旧主题覆盖、手写通用控件和 `useEscapeKey`，完成源码审查。
9. 运行单元、集成、可视化回归、服务端测试、类型检查、生产构建和 OpenSpec 严格校验。

变更保留在 `refactor/frontend-shadcn-vitest` 分支。需要恢复时使用文件编辑工具逐项恢复，不使用 Git 回滚命令。

## Open Questions

无。
