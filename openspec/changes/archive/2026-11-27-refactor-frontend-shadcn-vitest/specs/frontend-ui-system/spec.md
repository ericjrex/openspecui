# Spec Delta

## Purpose

定义 OpenSpecUI 前端的设计令牌、组件行为、主题兼容性、可访问性和测试契约，确保使用 shadcn/ui 与 Vitest 重构后保持现有视觉与业务行为稳定。

## ADDED Requirements

### Requirement: Design Token 必须来源于现有常量

系统 SHALL 从现有源码和已安装的 Tailwind 主题中提取颜色、圆角、间距、字号、布局和效果常量，并将本表格作为视觉基线。实现时 SHALL 引用这些来源，不得凭记忆重新估算。

本文件中的来源路径均相对于仓库根目录。

#### 基础颜色令牌

| 令牌 | 深色值 | 浅色值 | 来源 |
| --- | --- | --- | --- |
| `background` | `oklch(12.9% 0.042 264.695)` | `#f8fafc` | `node_modules/tailwindcss/theme.css:224`；`packages/web/src/index.css:25-29` |
| `foreground` | `oklch(96.8% 0.007 247.896)` | `#0f172a` | `node_modules/tailwindcss/theme.css:215`；`packages/web/src/index.css:101-104` |
| `foreground-secondary` | `oklch(92.9% 0.013 255.508)` | `#0f172a` | `node_modules/tailwindcss/theme.css:216`；`packages/web/src/index.css:101-104` |
| `foreground-muted` | `oklch(86.9% 0.022 252.894)` | `#334155` | `node_modules/tailwindcss/theme.css:217`；`packages/web/src/index.css:106-108` |
| `foreground-subtle` | `oklch(70.4% 0.04 256.788)` | `#64748b` | `node_modules/tailwindcss/theme.css:218`；`packages/web/src/index.css:110-114` |
| `foreground-faint` | `oklch(55.4% 0.046 257.417)` | `#64748b` | `node_modules/tailwindcss/theme.css:219`；`packages/web/src/index.css:110-114` |
| `card` | `oklch(20.8% 0.042 265.755)` | `#ffffff` | `node_modules/tailwindcss/theme.css:223`；`packages/web/src/index.css:41-43` |
| `popover` | `oklch(20.8% 0.042 265.755)` | `#ffffff` | `node_modules/tailwindcss/theme.css:223`；`packages/web/src/index.css:41-43` |
| `secondary` | `oklch(27.9% 0.041 260.031)` | `#e2e8f0` | `node_modules/tailwindcss/theme.css:222`；`packages/web/src/index.css:46-48` |
| `muted` | `oklch(27.9% 0.041 260.031)` | `#f1f5f9` | `node_modules/tailwindcss/theme.css:222`；`packages/web/src/index.css:32-34` |
| `accent` | `oklch(27.9% 0.041 260.031)` | `#e2e8f0` | `node_modules/tailwindcss/theme.css:222`；`packages/web/src/index.css:46-48` |
| `border` | `oklch(27.9% 0.041 260.031)` | `#e2e8f0` | `node_modules/tailwindcss/theme.css:222`；`packages/web/src/index.css:74-77` |
| `border-strong` | `oklch(37.2% 0.044 257.287)` | `#cbd5e1` | `node_modules/tailwindcss/theme.css:221`；`packages/web/src/index.css:79-81` |
| `input` | `oklch(12.9% 0.042 264.695)` | `#f1f5f9` | `node_modules/tailwindcss/theme.css:224`；`packages/web/src/index.css:32-34` |
| `primary` | `oklch(58.8% 0.158 241.966)` | `oklch(58.8% 0.158 241.966)` | `node_modules/tailwindcss/theme.css:124`；`packages/web/src/App.tsx:176` |
| `primary-hover` | `oklch(68.5% 0.169 237.323)` | `oklch(68.5% 0.169 237.323)` | `node_modules/tailwindcss/theme.css:123`；`packages/web/src/App.tsx:176` |
| `primary-foreground` | `#ffffff` | `#ffffff` | `node_modules/tailwindcss/theme.css:323`；`packages/web/src/index.css:153-157` |
| `ring` | `oklch(74.6% 0.16 232.661)` | `#0369a1` | `node_modules/tailwindcss/theme.css:122`；`packages/web/src/index.css:120-124` |

#### 语义状态与 Diff 令牌

| 令牌 | 深色值 | 浅色值 | 来源 |
| --- | --- | --- | --- |
| `success-solid` | `oklch(59.6% 0.145 163.225)` | `oklch(59.6% 0.145 163.225)` | `node_modules/tailwindcss/theme.css:88`；`packages/web/src/index.css:154-157` |
| `success-text` | `oklch(76.5% 0.177 163.223)` | `#047857` | `node_modules/tailwindcss/theme.css:86`；`packages/web/src/index.css:126-129` |
| `warning-base` | `oklch(76.9% 0.188 70.08)` | `oklch(76.9% 0.188 70.08)` | `node_modules/tailwindcss/theme.css:39` |
| `warning-text` | `oklch(87.9% 0.169 91.605)` | `#b45309` | `node_modules/tailwindcss/theme.css:37`；`packages/web/src/index.css:131-136` |
| `destructive-solid` | `oklch(58.6% 0.253 17.585)` | `oklch(58.6% 0.253 17.585)` | `node_modules/tailwindcss/theme.css:208` |
| `destructive-text` | `oklch(71.2% 0.194 13.428)` | `#b91c1c` | `node_modules/tailwindcss/theme.css:206`；`packages/web/src/index.css:138-143` |
| `info-text` | `oklch(74.6% 0.16 232.661)` | `#0369a1` | `node_modules/tailwindcss/theme.css:122`；`packages/web/src/index.css:120-124` |
| `violet-text` | `oklch(81.1% 0.111 293.571)` | `#6d28d9` | `node_modules/tailwindcss/theme.css:157`；`packages/web/src/index.css:145-147` |
| `indigo-text` | `oklch(78.5% 0.115 274.713)` | `#4338ca` | `node_modules/tailwindcss/theme.css:145`；`packages/web/src/index.css:149-151` |
| `repo-dot-cyan` | `oklch(78.9% 0.154 211.53)` | `oklch(78.9% 0.154 211.53)` | `node_modules/tailwindcss/theme.css:110`；`packages/web/src/components/ChangeBoard.tsx:56-61` |
| `diff-added-surface` | `oklch(26.2% 0.051 172.552)` | `#ecfdf5` | `node_modules/tailwindcss/theme.css:92`；`packages/web/src/index.css:87-89` |
| `diff-removed-surface` | `oklch(27.1% 0.105 12.094)` | `#fef2f2` | `node_modules/tailwindcss/theme.css:212`；`packages/web/src/index.css:84-86` |
| `diff-modified-surface` | `oklch(27.9% 0.077 45.635)` | `#fffbeb` | `node_modules/tailwindcss/theme.css:44`；`packages/web/src/index.css:91-93` |
| `diff-info-surface` | `oklch(29.3% 0.066 243.157)` | `#f0f9ff` | `node_modules/tailwindcss/theme.css:128`；`packages/web/src/index.css:94-96` |
| `diff-renamed-surface` | `oklch(28.3% 0.141 291.089)` | `oklch(96.9% 0.016 293.756)` | `node_modules/tailwindcss/theme.css:164`；`node_modules/tailwindcss/theme.css:155` |
| `overlay` | `rgb(0 0 0 / 70%)` | `rgb(0 0 0 / 70%)` | `packages/web/src/App.tsx:372`；`packages/web/src/components/IdeaModal.tsx:83` |
| `overlay-strong` | `rgb(0 0 0 / 75%)` | `rgb(0 0 0 / 75%)` | `packages/web/src/components/ChangeDetailView.tsx:511`；`packages/web/src/components/LocalFolderPickerModal.tsx:47` |

现有透明度表达式 SHALL 保留其色相与透明度，包括 `10%`、`15%`、`20%`、`25%`、`30%`、`35%`、`40%`、`50%`、`60%`、`70%`、`80%` 和 `90%`。头部背景使用 Slate 950 的 `90%` 透明度，来源为 `packages/web/src/App.tsx:150`。

#### 圆角令牌

| 名称 | 值 | 现有用途 | 来源 |
| --- | --- | --- | --- |
| `rounded-xs` | `0.125rem` | 极小控件 | `node_modules/tailwindcss/theme.css:397` |
| `rounded-sm` | `0.25rem` | `rounded` 徽章、图标按钮 | `node_modules/tailwindcss/theme.css:398`；`packages/web/src/components/ChangeBoard.tsx:395` |
| `rounded-md` | `0.375rem` | 标签页、分段控件 | `node_modules/tailwindcss/theme.css:399`；`packages/web/src/components/DiffViewer.tsx:118` |
| `rounded-lg` | `0.5rem` | 按钮、输入框、提示条 | `node_modules/tailwindcss/theme.css:400`；`packages/web/src/components/WorkspaceModal.tsx:307` |
| `rounded-xl` | `0.75rem` | 卡片、弹窗 | `node_modules/tailwindcss/theme.css:401`；`packages/web/src/components/GitActivityView.tsx:110` |
| `rounded-2xl` | `1rem` | 大卡片、Change 详情 | `node_modules/tailwindcss/theme.css:402`；`packages/web/src/components/ChangeDetailView.tsx:519` |
| `rounded-full` | `9999px` | 圆点、胶囊标签 | `packages/web/src/components/ChangeBoard.tsx:393` |
| `task-checkbox-radius` | `4px` | Markdown 任务复选框 | `packages/web/src/components/MarkdownViewer.tsx:233` |

shadcn 的基础圆角令牌 SHALL 设置为 `0.5rem`，以现有 `rounded-lg` 控件为基准，其余组件通过现有圆角阶跃保持视觉密度。

#### 间距令牌

Tailwind v4 的基础间距单位为 `0.25rem`，来源为 `node_modules/tailwindcss/theme.css:325`。

| 类名 | 计算值 | 现有用途 | 来源 |
| --- | --- | --- | --- |
| `1` | `0.25rem / 4px` | 图标与紧凑间距 | `packages/web/src/components/GitActivityView.tsx:124` |
| `1.5` | `0.375rem / 6px` | 卡片内部小间距 | `packages/web/src/components/ChangeBoard.tsx:391` |
| `2` | `0.5rem / 8px` | 控件间距、表单分组 | `packages/web/src/components/WorkspaceModal.tsx:345` |
| `2.5` | `0.625rem / 10px` | 按钮水平内边距 | `packages/web/src/App.tsx:176` |
| `3` | `0.75rem / 12px` | 卡片内边距、区块间距 | `packages/web/src/components/DiffViewer.tsx:104` |
| `3.5` | `0.875rem / 14px` | 卡片和弹窗头部内边距 | `packages/web/src/components/ChangeBoard.tsx:386`；`packages/web/src/components/ChangeDetailView.tsx:523` |
| `4` | `1rem / 16px` | 页面、卡片、弹窗内边距 | `packages/web/src/App.tsx:280`；`packages/web/src/components/GitActivityView.tsx:110` |
| `5` | `1.25rem / 20px` | 弹窗和大区块内边距 | `packages/web/src/components/WorkspaceModal.tsx:298` |
| `6` | `1.5rem / 24px` | 页面中等宽度内边距 | `packages/web/src/App.tsx:151` |
| `8` | `2rem / 32px` | 空状态内边距 | `packages/web/src/components/ChangeBoard.tsx:973` |
| `10` | `2.5rem / 40px` | 大空状态内边距 | `packages/web/src/components/ChangeBoard.tsx:1093` |
| `12` | `3rem / 48px` | 首屏空状态内边距 | `packages/web/src/App.tsx:298` |

#### 字体与排版令牌

| 令牌 | 值 | 来源 |
| --- | --- | --- |
| `font-sans` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif` | `packages/web/src/index.css:12-14` |
| `font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | `packages/web/src/index.css:16-18` |
| `text-10` | `10px` | `packages/web/src/components/GitActivityView.tsx:114` |
| `text-11` | `11px` | `packages/web/src/App.tsx:209` |
| `text-xs` | `0.75rem / 1rem` | `node_modules/tailwindcss/theme.css:347-348` |
| `text-sm` | `0.875rem / 1.25rem` | `node_modules/tailwindcss/theme.css:349-350` |
| `text-base` | `1rem / 1.5rem` | `node_modules/tailwindcss/theme.css:351-352` |
| `text-lg` | `1.125rem / 1.75rem` | `node_modules/tailwindcss/theme.css:353-354` |
| `text-xl` | `1.25rem / 1.75rem` | `node_modules/tailwindcss/theme.css:355-356` |
| `font-normal` | `400` | `node_modules/tailwindcss/theme.css:376` |
| `font-medium` | `500` | `node_modules/tailwindcss/theme.css:377` |
| `font-semibold` | `600` | `node_modules/tailwindcss/theme.css:378` |
| `font-bold` | `700` | `node_modules/tailwindcss/theme.css:379` |

#### 布局、断点与效果令牌

| 名称 | 值 | 来源 |
| --- | --- | --- |
| `breakpoint-sm` | `40rem` | `node_modules/tailwindcss/theme.css:327` |
| `breakpoint-md` | `48rem` | `node_modules/tailwindcss/theme.css:328` |
| `breakpoint-lg` | `64rem` | `node_modules/tailwindcss/theme.css:329` |
| `breakpoint-xl` | `80rem` | `node_modules/tailwindcss/theme.css:330` |
| `breakpoint-2xl` | `96rem` | `node_modules/tailwindcss/theme.css:331` |
| 页面水平内边距 | `1rem`；`md` 下 `1.5rem` | `packages/web/src/App.tsx:151`；`packages/web/src/App.tsx:280` |
| 页面垂直内边距 | `1rem` | `packages/web/src/App.tsx:280` |
| 顶部栏垂直内边距 | `0.75rem` | `packages/web/src/App.tsx:151` |
| Change 详情尺寸 | `96vw × 92vh`，最大宽度 `1600px` | `packages/web/src/components/ChangeDetailView.tsx:519` |
| Change 详情全屏尺寸 | `100vw × 100vh` | `packages/web/src/components/ChangeDetailView.tsx:518` |
| 工作区弹窗最大宽度 | `42rem` | `node_modules/tailwindcss/theme.css:340`；`packages/web/src/components/WorkspaceModal.tsx:288` |
| 工作区弹窗内容最大高度 | `75vh` | `packages/web/src/components/WorkspaceModal.tsx:298` |
| 目录弹窗最大宽度 | `36rem` | `node_modules/tailwindcss/theme.css:339`；`packages/web/src/components/LocalFolderPickerModal.tsx:48` |
| 目录列表高度 | `16rem` | `packages/web/src/components/LocalFolderPickerModal.tsx:99` |
| Idea 与手机弹窗最大宽度 | `28rem` | `node_modules/tailwindcss/theme.css:337`；`packages/web/src/components/IdeaModal.tsx:84`；`packages/web/src/App.tsx:373` |
| 跨仓关联弹窗最大宽度 | `32rem` | `node_modules/tailwindcss/theme.css:338`；`packages/web/src/components/ChangeBoard.tsx:1216` |
| 顶部栏层级 | `30` | `packages/web/src/App.tsx:150` |
| 普通弹窗层级 | `50` | `packages/web/src/components/ChangeDetailView.tsx:511` |
| 嵌套目录弹窗层级 | `60` | `packages/web/src/components/LocalFolderPickerModal.tsx:47` |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | `node_modules/tailwindcss/theme.css:409` |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | `node_modules/tailwindcss/theme.css:412` |
| `blur-xs` | `4px` | `node_modules/tailwindcss/theme.css:476` |
| 默认 `backdrop-blur` | `8px` | `node_modules/tailwindcss/theme.css:477`；`packages/web/src/App.tsx:150` |
| 滚动条宽度与高度 | `8px` | `packages/web/src/index.css:159-162` |
| 深色滚动条轨道 | `#0f172a` | `packages/web/src/index.css:166-168` |
| 深色滚动条滑块 | `#334155`；悬停 `#475569` | `packages/web/src/index.css:170-176` |
| 浅色滚动条轨道 | `#f1f5f9` | `packages/web/src/index.css:178-180` |
| 浅色滚动条滑块 | `#cbd5e1`；悬停 `#94a3b8` | `packages/web/src/index.css:182-187` |

#### Scenario: 令牌与现有视觉一致

- **WHEN** 前端组件使用本文件定义的颜色、圆角、间距、字号或布局令牌
- **THEN** 计算后的视觉值与现有源码记录一致，深色与浅色模式均不得出现未记录的色相或尺寸猜测

#### Scenario: 令牌来源可追溯

- **WHEN** 开发者调整某个设计令牌
- **THEN** 变更说明必须指出对应源码位置，并同步更新本表与视觉回归基线

### Requirement: 浅色与深色主题必须完整兼容

系统 SHALL 保留 `openspecui-theme` 本地存储键、默认深色状态和两种主题状态。深色主题 SHALL 使用 `.dark` 类，浅色主题 SHALL 使用 `:root` 默认令牌，并同步设置 `color-scheme`。首屏 SHALL 在 React 挂载前恢复主题，避免闪烁。

页面背景、卡片、弹窗、浮层、输入框、悬停态、焦点环、Markdown、Diff、滚动条和原生控件 SHALL 全部使用语义令牌。系统不得依赖 `[class*="bg-slate-*"]` 通配覆盖或 `!important` 实现浅色主题。

#### Scenario: 默认深色

- **WHEN** 用户首次打开工作台且本地存储没有主题值
- **THEN** 页面使用深色令牌，`html` 元素包含 `dark` 类，`color-scheme` 为 `dark`

#### Scenario: 恢复已保存的浅色主题

- **WHEN** 用户此前选择浅色主题并刷新页面
- **THEN** 首屏直接使用浅色令牌，`html` 元素不包含 `dark` 类，`color-scheme` 为 `light`

#### Scenario: 切换主题

- **WHEN** 用户点击主题切换控件
- **THEN** 页面立即切换全部语义令牌，并将新主题写入 `openspecui-theme`，不得残留深色色块或低对比度文字

### Requirement: 前端组件必须遵循统一组件契约

系统 SHALL 使用 shadcn/ui `@shadcn` registry 提供的基础组件构建界面。业务组件 SHALL 组合基础组件，不得复制按钮、输入框、弹窗、标签页、状态标签和空状态的样式与行为。

按钮、输入框、选择框、复选框、弹窗、确认弹窗、标签页、分段控件、卡片、标签、进度条、提示条、空状态、加载状态、表格、折叠面板和工具提示 SHALL 使用统一组件。Markdown、Diff、看板卡片和 Git 时间线等专业内容 SHALL 保留为领域组件。

#### Scenario: 重复界面模式

- **WHEN** 页面出现相同类型的按钮、表单控件、弹窗或状态提示
- **THEN** 实现必须复用同一基础组件或公共业务组件，不得新增一套独立样式

#### Scenario: 基础组件升级

- **WHEN** shadcn/ui 基础组件更新
- **THEN** 业务组件通过组件属性和语义令牌接入，领域逻辑不得依赖基础组件的内部 DOM 结构

### Requirement: 键盘、焦点和可访问性必须统一

系统 SHALL 为所有交互控件提供可访问名称、可见焦点和键盘操作。图标按钮 SHALL 提供 `aria-label`，装饰图标 SHALL 设置 `aria-hidden`。表单标签 SHALL 与控件 ID 关联，错误与状态提示 SHALL 使用 `Alert`、`role="status"` 或 `aria-live`。

弹窗 SHALL 提供标题、焦点约束、背景隔离、Esc 关闭和关闭后焦点恢复。嵌套弹窗 SHALL 只关闭最顶层。标签页与分段控件 SHALL 支持方向键。进度条 SHALL 提供可访问名称和数值。

仓库、Idea、Change 和跨仓组拖拽 SHALL 支持键盘排序，并保留现有只读模式禁用规则。动画 SHALL 响应 `prefers-reduced-motion`。

#### Scenario: 嵌套弹窗 Esc

- **WHEN** 工作区弹窗中打开目录选择弹窗，用户按下 Esc
- **THEN** 仅关闭目录选择弹窗，工作区弹窗保持打开，关闭后焦点返回触发控件

#### Scenario: 键盘打开 Change

- **WHEN** 用户使用 Tab 聚焦 Change 卡片的打开按钮并按 Enter 或 Space
- **THEN** 系统打开 Change 详情，焦点进入详情弹窗

#### Scenario: 键盘拖拽

- **WHEN** 用户使用键盘激活拖拽控件并使用方向键调整顺序
- **THEN** 卡片顺序更新并通过现有接口持久化，局域网只读模式下操作保持禁用

#### Scenario: 只读状态

- **WHEN** 系统处于局域网只读模式或远程缓存仓库上下文
- **THEN** 写操作控件保持禁用并提供可访问说明，前端不得发起对应写请求

### Requirement: Markdown 与 Diff 必须保持现有行为

系统 SHALL 保留 `react-markdown` 安全渲染、GFM 表格、标题锚点、文档内链接跳转、源码切换和任务行号映射。任务复选框 SHALL 使用任务文本作为可访问名称，并保留本地仓回写、远程只读、归档只读和并发冲突保护。

双仓 Markdown 并排视图 SHALL 按仓库生成唯一标题 ID。锚点跳转 SHALL 同时移动焦点并滚动到目标位置。Diff SHALL 保留 Unified/Split 模式、文件状态、截断提示和长行滚动。

#### Scenario: 任务勾选

- **WHEN** 用户在本地仓 Tasks 预览中勾选任务
- **THEN** 系统仅回写对应任务行，保留其余 Markdown 内容，并立即刷新进度

#### Scenario: 内部链接

- **WHEN** 用户点击指向 `proposal.md`、`design.md`、`tasks.md` 或 `specs/**` 的相对链接
- **THEN** 系统在当前 Change 详情内切换标签页并定位目标，不触发 SPA 路径跳转

#### Scenario: 只读任务

- **WHEN** 当前任务来自远程缓存仓、归档或局域网只读模式
- **THEN** 复选框禁用并显示只读说明，服务端保护规则保持不变

### Requirement: Vitest 必须覆盖单元、集成和可视化回归

系统 SHALL 使用 Vitest 作为前端测试入口，并覆盖单元测试、组件集成测试和 Browser Mode 可视化回归测试。

单元测试 SHALL 覆盖主题状态、令牌映射、状态变体、归档排序和 Diff 行生成等纯逻辑。组件集成测试 SHALL 覆盖工作区表单、Idea、目录选择、看板筛选、Change 详情、Markdown 任务、Git 分支和只读状态。集成测试 SHALL 使用 Testing Library、user-event 和 jest-dom，不得用伪造实现替代真实组件行为。

可视化回归 SHALL 使用 Vitest Browser Playwright，覆盖深色与浅色主题、桌面与移动视口、主要弹窗、Markdown、Diff 和空状态。截图基线 SHALL 在字体、动画和视口稳定的条件下生成。

#### Scenario: 单元测试

- **WHEN** 开发者修改主题逻辑、状态映射或数据转换函数
- **THEN** 对应 Vitest 单元测试能够独立运行并快速失败

#### Scenario: 组件集成测试

- **WHEN** 开发者修改弹窗、表单、任务复选框或分支选择交互
- **THEN** Testing Library 集成测试验证用户可见行为、键盘操作和只读保护

#### Scenario: 可视化回归

- **WHEN** 组件样式或布局发生变化
- **THEN** Browser Mode 截图对比能够生成实际图、预期图和差异图，并指出超出阈值的视觉变化

### Requirement: 现有业务行为必须保持

系统 SHALL 保持现有服务端 API、共享类型、OpenSpec 解析、Git 状态与 Diff、任务回写、文件监听、跨仓关联、归档排序和局域网只读规则。重构不得改变数据请求路径、请求体、响应结构或持久化格式。

#### Scenario: 现有 OpenSpec 流程

- **WHEN** 用户完成重构后的工作区创建、Change 查看、任务勾选、跨仓关联和 Git 浏览
- **THEN** 现有 OpenSpec 规范场景继续通过，服务端测试保持通过

#### Scenario: 生产构建

- **WHEN** 执行完整类型检查、前端测试、服务端测试和生产构建
- **THEN** 所有检查通过，构建产物可由现有服务端静态托管并正常访问
