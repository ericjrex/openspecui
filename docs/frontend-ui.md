# 前端 UI 体系

## 基础信息

- 位置：`packages/web`
- 组件库：shadcn/ui `@shadcn` registry，Radix 底座，Nova 样式，CSS variables
- 样式：Tailwind CSS v4，语义令牌定义于 `packages/web/src/index.css`
- 测试：Vitest（`unit`、`integration`、`vrt` 三个项目）

## Design Token 来源

视觉常量的权威记录位于 `openspec/changes/refactor-frontend-shadcn-vitest/specs/frontend-ui-system/spec.md`，所有颜色、圆角、间距、字号、布局和效果实现必须引用该文件及其来源，不得凭记忆重新估算。

- 浅色令牌位于 `:root`，深色令牌位于 `.dark`，通过 `@theme inline` 映射为 Tailwind 工具类。
- 基础圆角为 `0.5rem`（现有 `rounded-lg`）。
- 主题切换使用 `useTheme`（`src/hooks/useTheme.ts`），存储键为 `openspecui-theme`，默认深色。
- 首屏主题恢复逻辑位于 `packages/web/index.html`，React 挂载前读取存储并设置 `dark` 类与 `color-scheme`。

## 组件选择规则

| 场景 | 组件 |
| --- | --- |
| 按钮、图标按钮 | `Button`（`size="icon-sm"` + `aria-label`） |
| 输入、文本域 | `Input`、`Textarea` |
| 下拉选择 | `Select` + `SelectGroup` + `SelectItem`（空选项使用内部哨兵值） |
| 复选框 | `Checkbox` + `Field` + `FieldLabel` |
| 表单布局 | `Field`、`FieldGroup`、`FieldLabel`、`FieldDescription`、`FieldError` |
| 弹窗 | `Dialog`（嵌套场景依赖 Dialog 栈处理 Esc 与焦点） |
| 破坏性确认 | `AlertDialog`（远程解绑提供取消、仅解绑、解绑并清理三个动作） |
| 标签页 | `Tabs` + `TabsList` + `TabsTrigger` |
| 分段切换 | `ToggleGroup` + `ToggleGroupItem` |
| 卡片 | `Card` + `CardHeader` + `CardContent` |
| 状态 | `StatusBadge`（`src/components/common/StatusBadge.tsx`，映射位于 `src/lib/status.ts`） |
| 进度 | `Progress`（提供可访问名称） |
| 提示 | `InlineAlert`（`src/components/common/InlineAlert.tsx`） |
| 空状态 | `EmptyState`（`src/components/common/EmptyState.tsx`） |
| 加载 | `LoadingState`、`Skeleton`、`Spinner`（`role="status"`） |
| 列表 | `Item` + `ItemGroup` |
| 表格 | `Table` 系列 |
| 折叠 | `Collapsible` |
| 提示条 | `Tooltip`（`TooltipProvider` 已在 `main.tsx` 全局挂载） |

业务组件组合基础组件，不得复制样式与行为。Markdown、Diff、看板卡片和 Git 时间线保留为领域组件，存放于：

- `src/components/layout/`：应用外壳
- `src/components/workspace/`：工作区弹窗与选择器
- `src/components/board/`：看板领域组件
- `src/components/change-detail/`：详情领域组件
- `src/components/git/`、`src/components/history/`：Git 与 Spec 历史
- `src/components/markdown/`、`src/components/diff/`：文档与差异
- `src/components/common/`：公共业务组件
- `src/lib/`：`cn`、状态映射、主题、Diff 行生成

## 禁止事项

- 禁止新增 `html.theme-light [class*="bg-slate-*"]` 类通配覆盖或 `!important` 主题规则（`prefers-reduced-motion` 除外）。
- 禁止在业务组件中使用直接颜色类（`bg-slate-*`、`text-sky-*` 等），统一使用语义令牌（`bg-background`、`text-info`、`bg-diff-added` 等）。
- 禁止手写通用遮罩弹窗，统一使用受控 `Dialog`。
- 禁止使用 `window.confirm`，破坏性操作使用 `AlertDialog`。
- 禁止删除业务功能的只读保护、归档排序与并发冲突处理。

## 可访问性要求

- 图标按钮提供 `aria-label`，装饰图标设置 `aria-hidden`。
- 表单标签与控件 ID 关联，错误使用 `FieldError` 或 `Alert`。
- 弹窗提供标题、焦点约束、Esc 关闭与焦点恢复，嵌套弹窗只关闭最上层。
- 标签页与分段控件支持方向键，进度条提供名称与数值。
- 拖拽支持鼠标、触控与键盘，只读模式禁用。
- 动画响应 `prefers-reduced-motion`。

## 测试

### 运行方式

```bash
npm run test:unit --workspace=@openspecui/web
npm run test:integration --workspace=@openspecui/web
npm run test:vrt --workspace=@openspecui/web
npm run test:web
```

`npm run test:web` 运行全部三个 Vitest 项目。根 `package.json` 同步提供 `test:web`。

### 测试项目

| 项目 | 匹配 | 环境 | 用途 |
| --- | --- | --- | --- |
| `unit` | `test/unit/**/*.unit.test.ts` | `node` | 主题、状态映射、归档排序、Diff 行生成 |
| `integration` | `test/integration/**/*.integration.test.tsx` | `jsdom` | 真实组件渲染、用户交互、键盘、只读（Testing Library + user-event + jest-dom） |
| `vrt` | `test/vrt/**/*.vrt.test.tsx` | Browser Mode + Playwright Chromium | 浅色/深色 × 桌面/移动截图对比 |

测试与源码分离：测试按业务域存放在 `packages/web/test/{unit,integration,vrt}/<domain>/`，
真实机器交互（服务启停、临时目录、git 建仓）收敛在 `packages/web/test/e2e/`，
测试描述文件不得直接引用 `node:` 内建模块、硬编码本机路径或字面量配置。
统一配置入口为 `packages/web/test/config.ts`（经 `packages/web/.env` 覆盖，
见 `packages/web/.env.example`，`.env` 本身不提交），超时、视口、阈值一律引用该配置。

集成测试不得 mock API 或伪造实现。Git 相关测试启动真实 Fastify 服务并操作真实 Git 仓库。

### 可视化回归

- 固定视口：桌面 `1440×900`，移动 `390×844`（Vitest Browser 实例名 `desktop`/`mobile`）。
- 截图命名包含主题与视口，例如 `common-dark-desktop`，避免双实例基线冲突。
- 像素差异阈值初始为 `1%`（`allowedMismatchedPixelRatio: 0.01`）。
- 基线更新必须人工确认：`npm run test:vrt --workspace=@openspecui/web -- -u`，检查实际图、预期图与差异图后提交。

## 视觉基线

- 重构前基线：`docs/images/frontend-baseline/`（深色/浅色 × 桌面/移动，看板、归档、Specs、Git、Diff、详情、弹窗）。
- 组件级回归基线：各 `__screenshots__/` 目录，随测试文件存放。
