# Tasks

## 1. 基线与测试基础设施

- [x] 1.1 捕获现有工作台在浅色/深色、1440×900/390×844 下的看板、详情、Git、Markdown、Diff 和弹窗截图，验证基线文件完整且可用于后续对比
- [x] 1.2 在 `packages/web` 添加 Vitest、Testing Library、user-event、jest-dom、jsdom、Vitest Browser Playwright 和 Playwright 依赖，验证 `npm install` 与锁文件更新成功
- [x] 1.3 添加 `vitest.config.ts` 的 `unit`、`integration`、`vrt` 三个项目及根测试脚本，验证三个项目均可独立运行
- [x] 1.4 添加 `vitest.setup.ts` 和最小 React 组件测试，验证 jest-dom 匹配器、清理逻辑和 JSX 转换正常
- [x] 1.5 为主题、状态映射、归档排序和 Diff 行生成建立初始单元测试，验证现有纯逻辑测试通过

## 2. shadcn/ui 与组件基础

- [x] 2.1 在 `packages/web` 初始化 shadcn/ui，使用 `@shadcn`、Radix、Nova 和 CSS variables，验证 `npx shadcn@latest info --json -c packages/web` 返回正确配置
- [x] 2.2 配置 TypeScript 与 Vite 的 `@/*` 别名，验证 `npm run typecheck --workspace=@openspecui/web` 通过
- [x] 2.3 添加规范与设计约定的首批 shadcn 组件，验证所有组件可导入且前端生产构建通过
- [x] 2.4 添加 `src/lib/utils.ts`、阶段常量、状态映射和仓库颜色映射，验证单元测试覆盖映射结果
- [x] 2.5 建立 `StatusBadge`、`IconButton`、`EmptyState`、`LoadingState` 和 `InlineAlert` 公共组件，验证组件测试覆盖各状态与可访问名称

## 3. Design Token 与主题系统

- [x] 3.1 按规范表格在 `src/index.css` 建立浅色与深色语义令牌，验证计算样式与表格中的颜色、圆角、间距和效果一致
- [x] 3.2 配置 `@custom-variant dark`、`@theme inline`、基础字体和 `color-scheme`，验证 Tailwind v4 能生成全部语义工具类
- [x] 3.3 实现主题 Hook 与 `ThemeToggle`，保留 `openspecui-theme`、默认深色和两种主题状态，验证主题单元与集成测试通过
- [x] 3.4 在 `index.html` 增加首屏主题恢复逻辑，验证刷新页面无主题闪烁
- [x] 3.5 删除 `theme-light` 通配覆盖与相关 `!important` 规则，验证源码搜索不再存在旧主题覆盖且双主题截图通过

## 4. 应用外壳与全局布局

- [x] 4.1 拆分 `layout/AppHeader`、主视图页签、只读横幅和页面内容区，验证现有全宽布局与响应式断点保持不变
- [x] 4.2 迁移工作区切换、分支状态、主题、手机访问和刷新控件，验证键盘操作与图标按钮可访问名称通过
- [x] 4.3 迁移全局错误、空工作区和首屏加载状态，验证 `Alert`、`Empty`、`Skeleton` 与实时区域语义通过
- [x] 4.4 为应用外壳建立浅色/深色桌面与移动截图测试，验证视觉回归阈值内无意外差异

## 5. 工作区与表单弹窗

- [x] 5.1 将 `WorkspaceModal` 迁移为 `Dialog`、`Field`、`Input`、`Select`、`Checkbox` 和 `Button`，验证创建与绑定流程的服务端请求保持不变
- [x] 5.2 将 `LocalFolderPickerModal` 迁移为嵌套 `Dialog`，验证 Esc 只关闭最上层且关闭后焦点返回触发控件
- [x] 5.3 将 `IdeaModal` 迁移为 `Dialog` 与 `Field`，验证创建、编辑、删除、只读状态和错误提示通过集成测试
- [x] 5.4 使用 `AlertDialog` 替换删除工作区、解绑仓库和缓存清理确认，验证远程解绑具备取消、仅解绑、解绑并清理三个动作
- [x] 5.5 为 Select 空选项实现内部哨兵值转换，验证“不限定仓库”“暂无工作区”等选项显示与提交数据正确
- [x] 5.6 为工作区与 Idea 表单建立可视化回归，验证浅色/深色和桌面/移动布局无意外变化

## 6. Change 看板与拖拽

- [x] 6.1 将 `ChangeBoard` 拆分为仓库筛选、阶段列、Change 卡、Idea 卡、归档、Specs 和跨仓组组件，验证现有页面结构完整
- [x] 6.2 迁移 Board/Archive/Specs 页签、布局切换、搜索和排序控件，验证 Tabs、ToggleGroup、InputGroup 和 Select 的键盘行为通过
- [x] 6.3 使用 Card、Badge、Progress 和状态映射重构卡片，验证阶段色、产物状态、任务进度和可访问名称正确
- [x] 6.4 使用 `@dnd-kit` 替换仓库、Idea、Change 和跨仓组原生拖拽，验证鼠标、触控、键盘排序及现有持久化接口通过
- [x] 6.5 保留只读模式、跨阶段拖拽禁止和归档排序规则，验证局域网只读与归档时间倒序场景通过
- [x] 6.6 建立看板、归档、Specs、Ideas 和跨仓视图的可视化回归，验证浅色/深色桌面截图符合基线

## 7. Change 详情、Markdown 与 Diff

- [x] 7.1 将 `ChangeDetailView` 迁移为受控 `Dialog`，保留全屏切换、双仓对照和顶部操作，验证焦点约束、Esc、背景隔离和焦点恢复通过
- [x] 7.2 迁移 Proposal、Specs、Design、Tasks、Git 页签与 Delta 对比控件，验证现有标签切换和状态提示行为保持
- [x] 7.3 重构 `MarkdownViewer` 的 shadcn Table、Checkbox、Separator 和语义样式，验证 GFM、源码切换、任务行号映射和只读保护通过
- [x] 7.4 为双仓 Markdown 生成唯一标题 ID，并让锚点跳转同步移动焦点，验证内部链接与并排场景通过
- [x] 7.5 重构 `DiffViewer` 的 ToggleGroup、Badge、Table 和 Diff 令牌，验证 Unified/Split、文件状态、截断提示与长行滚动通过
- [x] 7.6 建立详情、Markdown、Tasks 和 Diff 的可视化回归，验证浅色/深色及全屏模式无意外差异

## 8. Git 活动与 Spec 历史

- [x] 8.1 将 `GitActivityView` 拆分为仓库状态卡、分支选择、远程同步和提交时间线，验证现有 API 调用与只读规则保持
- [x] 8.2 迁移分支 Select、同步按钮、错误 Alert 和时间线 Item，验证切换中、冲突、非 Git 仓库和远程缓存状态通过
- [x] 8.3 将 `SpecHistoryPanel` 迁移为 Card、Badge、Collapsible、Alert、Skeleton 和 Item，验证贡献者、Requirement 变更和分页行为保持
- [x] 8.4 建立 Git 与 Spec 历史的可视化回归，验证浅色/深色桌面布局无意外差异

## 9. 清理、文档与完整验证

- [x] 9.1 删除 `useEscapeKey.ts` 和全部手写通用遮罩弹窗，验证源码搜索不再存在旧弹窗实现
- [x] 9.2 清除业务组件中的直接 Slate、Sky、Emerald、Amber、Rose、Violet、Indigo 颜色类，验证仅语义令牌和规范允许的 Diff/Markdown 专用样式保留
- [x] 9.3 添加 `docs/frontend-ui.md`，验证令牌来源、组件规则、主题行为和可视化回归流程可追溯
- [x] 9.4 运行 `npm run test:web`，验证单元、集成和可视化回归三个项目全部通过
- [x] 9.5 运行 `npm run typecheck`、`npm test` 和 `npm run build`，验证共享类型、服务端测试与生产构建全部通过
- [x] 9.6 运行 `openspec validate refactor-frontend-shadcn-vitest --strict`，验证提案、规范、设计和任务文件全部有效
- [x] 9.7 启动生产工作台并执行现有 OpenSpec 核心流程，验证工作区、看板、任务、Git、Markdown、Diff 和局域网只读模式端到端正常
