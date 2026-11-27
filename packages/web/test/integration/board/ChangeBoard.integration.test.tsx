import type {
  CrossRepoChangeGroup,
  RepoBinding,
  RepoChangeEntry,
  Workspace,
} from '@openspecui/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { api } from '@/api';
import { ChangeBoard } from '@/components/ChangeBoard';
import { testConfig } from '#test/config';
import { allocTempDir, cleanupTempDirs, createLocalWorkspace, makeDir } from '#test/e2e/fixtures';
import { startTestServer, type TestServer } from '#test/e2e/server';

let testServer: TestServer | null = null;
let workspace: Workspace;
let changeGroups: CrossRepoChangeGroup[];

function makeEntry(
  repo: RepoBinding,
  changeName: string,
  options: Partial<RepoChangeEntry> = {},
): RepoChangeEntry {
  return {
    repoId: repo.id,
    repoName: repo.name,
    repoRole: repo.role,
    sourceType: 'local',
    changeName,
    specRootPath: repo.localPath,
    archived: false,
    stage: 'planning',
    summary: `${changeName} 的变更摘要`,
    artifactStates: [
      { id: 'proposal', label: 'Proposal', status: 'done' },
      { id: 'specs', label: 'Specs', status: 'next' },
      { id: 'design', label: 'Design', status: 'blocked', blockedBy: ['Specs'] },
      { id: 'tasks', label: 'Tasks', status: 'blocked', blockedBy: ['Design'] },
    ],
    artifacts: { hasProposal: true, hasDesign: false, hasSpecs: true, hasTasks: false },
    progress: { completed: 1, total: 4 },
    deltaDiffs: [],
    ...options,
  };
}

function makeGroups(activeWorkspace: Workspace): CrossRepoChangeGroup[] {
  const [frontend, backend] = activeWorkspace.repos;
  const alpha = makeEntry(frontend, 'Alpha');
  const beta = makeEntry(backend, 'Beta');
  const older = makeEntry(frontend, 'archive-old', {
    archived: true,
    stage: 'archived',
    archivedDate: '2026-10-01',
    archivedAt: '2026-10-01T10:00:00.000Z',
    archiveFolderName: '2026-10-01-archive-old',
  });
  const newer = makeEntry(backend, 'archive-new', {
    archived: true,
    stage: 'archived',
    archivedDate: '2026-11-01',
    archivedAt: '2026-11-01T10:00:00.000Z',
    archiveFolderName: '2026-11-01-archive-new',
  });
  return [
    {
      key: 'link:active-changes',
      title: '联合变更',
      isManualLink: true,
      manualLinkId: 'manual-active-changes',
      aggregateStatus: 'all_active',
      stage: 'planning',
      totalProgress: { completed: 2, total: 8 },
      entries: [alpha, beta],
    },
    {
      key: 'slug:archive-old',
      title: 'archive-old',
      isManualLink: false,
      aggregateStatus: 'all_archived',
      stage: 'archived',
      totalProgress: { completed: 1, total: 4 },
      entries: [older],
    },
    {
      key: 'slug:archive-new',
      title: 'archive-new',
      isManualLink: false,
      aggregateStatus: 'all_archived',
      stage: 'archived',
      totalProgress: { completed: 1, total: 4 },
      entries: [newer],
    },
  ];
}

function renderBoard(options: {
  readOnlyMode?: boolean;
  groups?: CrossRepoChangeGroup[];
  onOpenDetail?: (groupKey: string, focusRepoId?: string) => void;
  onRefresh?: () => void;
} = {}) {
  const onOpenDetail = options.onOpenDetail ?? vi.fn();
  const onOpenIdeaModal = vi.fn();
  const onRefresh = options.onRefresh ?? vi.fn();
  render(
    <ChangeBoard
      workspace={workspace}
      changeGroups={options.groups ?? changeGroups}
      mainSpecs={[]}
      readOnlyMode={options.readOnlyMode}
      onOpenDetail={onOpenDetail}
      onOpenIdeaModal={onOpenIdeaModal}
      onRefresh={onRefresh}
    />,
  );
  return { onOpenDetail, onOpenIdeaModal, onRefresh };
}

function setRect(element: Element, top: number) {
  const rect = {
    x: 0,
    y: top,
    top,
    left: 0,
    right: 300,
    bottom: top + 100,
    width: 300,
    height: 100,
    toJSON: () => ({}),
  };
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
}

beforeAll(async () => {
  const fixtureRoot = allocTempDir('change-board-fixtures-');
  const frontendPath = makeDir(fixtureRoot, 'frontend');
  const backendPath = makeDir(fixtureRoot, 'backend');

  testServer = await startTestServer();
  await api.initSession();
  workspace = await createLocalWorkspace(api, 'ChangeBoard 集成测试', [
    { directory: frontendPath, role: 'FE', name: '前端仓库' },
    { directory: backendPath, role: 'BE', name: '后端仓库' },
  ]);
  changeGroups = makeGroups(workspace);
}, testConfig.startupTimeoutMs);

afterAll(async () => {
  await testServer?.cleanup();
  testServer = null;
  cleanupTempDirs();
}, testConfig.startupTimeoutMs);

describe('ChangeBoard shadcn 与 dnd-kit 集成', () => {
  it('切换 Board、Archive 和 Specs 标签页并保持归档倒序', async () => {
    const user = userEvent.setup();
    renderBoard();

    expect(screen.getByRole('tab', { name: 'Board 看板 (2)' })).toHaveAttribute('data-state', 'active');
    await user.click(screen.getByRole('tab', { name: 'Archive 归档库 (2)' }));
    const archivedButtons = screen.getAllByRole('button', { name: /打开归档变更：/ });
    expect(archivedButtons[0]).toHaveAccessibleName('打开归档变更：archive-new（后端仓库）');
    expect(archivedButtons[1]).toHaveAccessibleName('打开归档变更：archive-old（前端仓库）');

    await user.click(screen.getByRole('tab', { name: 'Specs 规范库 (0)' }));
    expect(screen.getByText('暂无主规范')).toBeInTheDocument();
    expect(screen.getByText('openspec/specs/')).toBeInTheDocument();
  });

  it('按搜索文本和仓库筛选 Change 卡片', async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.type(screen.getByRole('searchbox', { name: '搜索变更' }), 'Beta');
    expect(screen.queryByRole('button', { name: '打开变更：Alpha（前端仓库）' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开变更：Beta（后端仓库）' })).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: '搜索变更' }));
    await user.click(screen.getByRole('button', { name: '筛选仓库：前端仓库' }));
    expect(screen.getByRole('button', { name: '打开变更：Alpha（前端仓库）' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '打开变更：Beta（后端仓库）' })).not.toBeInTheDocument();
  });

  it('切换 Stages、By repo、Cross-Repo 布局并展开 Ideas', async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole('button', { name: '展开 Ideas 列' }));
    expect(screen.getByText('暂无 Idea')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'By repo' }));
    expect(screen.queryByRole('button', { name: '展开 Ideas 列' })).not.toBeInTheDocument();
    expect(screen.getAllByText('1 项变更')).toHaveLength(2);

    await user.click(screen.getByRole('radio', { name: '跨仓聚合' }));
    expect(screen.getByRole('button', { name: '打开跨仓变更组：联合变更' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '拖动排序跨仓变更组：联合变更' })).toBeInTheDocument();
  });

  it('只读模式移除拖拽手柄和写操作，同时保留详情打开', async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    renderBoard({ readOnlyMode: true, onOpenDetail });

    expect(screen.queryByRole('button', { name: /拖动排序/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New idea' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关联跨仓项目' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '打开变更：Alpha（前端仓库）' }));
    expect(onOpenDetail).toHaveBeenCalledWith('link:active-changes', workspace.repos[0].id);
  });

  it('卡片打开按钮支持键盘操作', async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    renderBoard({ onOpenDetail });

    screen.getByRole('button', { name: '打开变更：Beta（后端仓库）' }).focus();
    await user.keyboard('{Enter}');
    expect(onOpenDetail).toHaveBeenCalledWith('link:active-changes', workspace.repos[1].id);
  });

  it('禁止把 Change 卡片排序到不同生命周期阶段', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const [frontend, backend] = workspace.repos;
    const planning = makeEntry(frontend, 'planning-only');
    const ready = makeEntry(backend, 'ready-only', { stage: 'ready_to_apply' });
    const groups: CrossRepoChangeGroup[] = [{
      key: 'slug:stage-boundary',
      title: '阶段边界',
      isManualLink: false,
      aggregateStatus: 'all_active',
      stage: 'planning',
      totalProgress: { completed: 2, total: 8 },
      entries: [planning, ready],
    }];
    renderBoard({ groups, onRefresh });

    const planningHandle = screen.getByRole('button', { name: '拖动排序变更：planning-only（前端仓库）' });
    const readyHandle = screen.getByRole('button', { name: '拖动排序变更：ready-only（后端仓库）' });
    setRect(planningHandle.closest('[data-slot="card"]')!, 0);
    setRect(readyHandle.closest('[data-slot="card"]')!, 120);

    planningHandle.focus();
    await user.keyboard('[Space]');
    expect(planningHandle).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[Space]');
    await waitFor(() => expect(planningHandle).not.toHaveAttribute('aria-pressed', 'true'));

    expect(onRefresh).not.toHaveBeenCalled();
    const registry = await api.listWorkspaces();
    const persisted = registry.workspaces.find((item) => item.id === workspace.id);
    expect(persisted?.customOrder?.changeOrder).toEqual([]);
  });

  it('键盘排序调用真实持久化接口并触发刷新回调', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderBoard({ onRefresh });

    const alphaHandle = screen.getByRole('button', { name: '拖动排序变更：Alpha（前端仓库）' });
    const betaHandle = screen.getByRole('button', { name: '拖动排序变更：Beta（后端仓库）' });
    const alphaCard = alphaHandle.closest('[data-slot="card"]');
    const betaCard = betaHandle.closest('[data-slot="card"]');
    expect(alphaCard).not.toBeNull();
    expect(betaCard).not.toBeNull();
    setRect(alphaCard!, 0);
    setRect(betaCard!, 120);

    alphaHandle.focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[Space]');

    await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    const registry = await api.listWorkspaces();
    const persisted = registry.workspaces.find((item) => item.id === workspace.id);
    expect(persisted?.customOrder?.changeOrder).toEqual([
      `${workspace.repos[1].id}:Beta`,
      `${workspace.repos[0].id}:Alpha`,
    ]);
  });
});
