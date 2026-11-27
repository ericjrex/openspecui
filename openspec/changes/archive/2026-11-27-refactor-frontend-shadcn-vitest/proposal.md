# Proposal

## Why

当前前端直接使用大量 Tailwind 颜色类名和手写弹窗，浅色主题依赖通配覆盖规则，组件行为、焦点管理和视觉回归缺少统一约束。需要建立可维护的组件体系，并在完整重构过程中保持现有主题、配色、布局密度和业务行为稳定。

## What Changes

- 从现有源码提取颜色、圆角、间距、字号、布局和效果常量，以带来源引用的 Markdown 表格记录为 Design Token。
- 在 `packages/web` 引入 shadcn/ui `@shadcn` registry，使用 Radix 组件底座和 Tailwind CSS v4 语义令牌。
- 重构应用外壳、工作区弹窗、Change 看板、Change 详情、Markdown、Diff、Git 活动和 Spec 历史界面。
- 使用 `@dnd-kit` 统一替换原生拖拽实现，保留现有排序持久化接口，并增加键盘和触控支持。
- 使用 Vitest 建立单元测试、组件集成测试和 Browser Mode 可视化回归测试。
- 统一弹窗焦点管理、键盘操作、表单标签、状态提示、空状态、加载状态和减弱动画偏好。
- 保留现有浅色/深色主题、`openspecui-theme` 存储键、默认深色状态、字体、圆角密度、滚动条和语义状态色。
- 保持服务端 API、共享类型、OpenSpec 解析、Git 操作、任务回写、文件监听和局域网只读规则不变。

## Capabilities

### New Capabilities

- `frontend-ui-system`: 定义前端设计令牌、shadcn/ui 组件使用约束、主题兼容性、可访问性以及 Vitest 测试与可视化回归要求。

### Modified Capabilities

<!-- 现有业务规范描述的行为保持不变。 -->

## Impact

- 主要影响 `packages/web` 的组件、样式、Vite/TypeScript 配置、前端依赖和测试目录。
- 新增 `packages/web/components.json`、主题与测试文档、Vitest 配置和前端测试基线。
- 新增 shadcn/ui、Radix、`@dnd-kit`、Vitest、Testing Library、jest-dom、jsdom 和 Vitest Browser Playwright 相关依赖。
- 不修改服务端接口和数据契约，不改变现有 OpenSpec 与 Git 业务能力。
- 无业务 API 破坏性变更；视觉与交互以现有页面为基线进行等价重构。
