import type { OpenSpecEnvironmentInfo, Workspace, WorkspaceIdea } from '@openspecui/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { api } from '@/api';
import { IdeaModal } from '@/components/IdeaModal';
import { LocalFolderPickerModal } from '@/components/LocalFolderPickerModal';
import { WorkspaceModal } from '@/components/WorkspaceModal';
import { testConfig } from '#test/config';
import { allocTempDir, cleanupTempDirs, makeDir } from '#test/e2e/fixtures';
import { startTestServer, type TestServer } from '#test/e2e/server';

const emptyEnv: OpenSpecEnvironmentInfo = {
  cliAvailable: false,
  stores: [],
  worksets: [],
};

let testServer: TestServer | null = null;
let workspace: Workspace;
let repoDir: string;
let secondRepoDir: string;
let emptyDir: string;

async function listIdeas(workspaceId: string): Promise<WorkspaceIdea[]> {
  const registry = await api.listWorkspaces();
  return registry.workspaces.find((item) => item.id === workspaceId)?.ideas ?? [];
}

async function chooseSelectOption(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string,
): Promise<void> {
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

interface WorkspaceLauncherProps {
  onClose: () => void;
  onCompleted: (workspaceId?: string) => void;
}

function WorkspaceLauncher({ onClose, onCompleted }: WorkspaceLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>打开工作区弹窗</button>
      {open && (
        <WorkspaceModal
          mode="create-workspace"
          env={emptyEnv}
          onClose={() => {
            setOpen(false);
            onClose();
          }}
          onCompleted={onCompleted}
        />
      )}
    </>
  );
}

beforeAll(async () => {
  const fixtureRoot = allocTempDir('web-modal-fixtures-');
  repoDir = makeDir(fixtureRoot, 'project-a', true);
  secondRepoDir = makeDir(fixtureRoot, 'project-b', true);
  emptyDir = makeDir(fixtureRoot, 'empty-folder');

  testServer = await startTestServer();
  await api.initSession();
  workspace = await api.createWorkspace({
    name: '弹窗集成测试工作区',
    repos: [
      {
        sourceType: 'local',
        localPath: repoDir,
        name: 'project-a',
        role: 'FE',
        kind: 'hybrid',
      },
    ],
  });
}, testConfig.startupTimeoutMs);

afterAll(async () => {
  await testServer?.cleanup();
  testServer = null;
  cleanupTempDirs();
}, testConfig.startupTimeoutMs);

describe('WorkspaceModal', () => {
  it('使用 Escape 关闭工作区弹窗并恢复触发按钮焦点', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCompleted = vi.fn();

    render(<WorkspaceLauncher onClose={onClose} onCompleted={onCompleted} />);
    const opener = screen.getByRole('button', { name: '打开工作区弹窗' });
    await user.click(opener);

    expect(screen.getByRole('dialog', { name: '新建逻辑工作区（支持单仓 / 前后端多仓 / 线上 Git）' })).toBeVisible();
    await user.keyboard('{Escape}');

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('嵌套目录弹窗使用 Dialog 栈处理 Escape 并恢复焦点', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<WorkspaceLauncher onClose={onClose} onCompleted={vi.fn()} />);
    const opener = screen.getByRole('button', { name: '打开工作区弹窗' });
    await user.click(opener);
    await user.type(screen.getByLabelText('本地仓库 / Worktree 绝对路径'), repoDir);

    const browseButton = screen.getByRole('button', { name: '浏览目录' });
    await user.click(browseButton);

    const pickerDialog = await screen.findByRole('dialog', { name: '浏览本机文件夹' });
    expect(within(pickerDialog).getByLabelText('当前目录')).toHaveValue(repoDir);
    expect(await within(pickerDialog).findByRole('button', { name: /openspec/ })).toBeVisible();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '浏览本机文件夹' })).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: '新建逻辑工作区（支持单仓 / 前后端多仓 / 线上 Git）' })).toBeVisible();
    expect(browseButton).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(opener).toHaveFocus();
  });

  it('关联所有表单标签并渲染 OpenSpec 空状态', async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceModal
        mode="create-workspace"
        env={emptyEnv}
        onClose={vi.fn()}
        onCompleted={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('逻辑工作区名称')).toBeEnabled();
    expect(screen.getByLabelText('本地仓库 / Worktree 绝对路径')).toBeEnabled();
    expect(screen.getByLabelText('显示名（可选）')).toBeEnabled();
    expect(screen.getByLabelText('角色标签')).toBeEnabled();
    expect(screen.getByRole('combobox', { name: '仓库类型' })).toBeEnabled();

    await user.click(screen.getByRole('tab', { name: '线上 Git 地址（只读缓存）' }));
    expect(screen.getByLabelText('线上 Git 地址')).toBeEnabled();
    expect(screen.getByLabelText('自动同步(分钟)')).toBeEnabled();

    await user.click(screen.getByRole('tab', { name: '扫描本地目录' }));
    expect(screen.getByLabelText('扫描父目录')).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: '仅显示 OpenSpec 项目（过滤无 openspec/ 的纯 Git 仓）' })).toBeChecked();

    await user.click(screen.getByRole('tab', { name: 'OpenSpec Workset/Store (0)' }));
    expect(screen.getByLabelText('openspec-ui.json 所在目录')).toBeEnabled();
    expect(screen.getByText('本机暂无已注册的 OpenSpec Workset 或 Store')).toBeVisible();
  });

  it('通过真实接口创建工作区并保留仓库表单数据', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCompleted = vi.fn();
    const workspaceName = `弹窗创建工作区-${Date.now()}`;

    render(
      <WorkspaceModal
        mode="create-workspace"
        env={emptyEnv}
        onClose={onClose}
        onCompleted={onCompleted}
      />,
    );

    await user.type(screen.getByLabelText('逻辑工作区名称'), workspaceName);
    await user.type(screen.getByLabelText('本地仓库 / Worktree 绝对路径'), secondRepoDir);
    await user.type(screen.getByLabelText('显示名（可选）'), 'project-b');
    const roleInput = screen.getByLabelText('角色标签');
    await user.clear(roleInput);
    await user.type(roleInput, 'BE');
    await chooseSelectOption(user, screen.getByRole('combobox', { name: '仓库类型' }), '纯代码仓');
    await user.click(screen.getByRole('button', { name: '创建并切换' }));

    await waitFor(() => expect(onCompleted).toHaveBeenCalledOnce());
    const createdId = onCompleted.mock.calls[0]?.[0] as string;
    const registry = await api.listWorkspaces();
    const createdWorkspace = registry.workspaces.find((item) => item.id === createdId);

    expect(createdWorkspace?.name).toBe(workspaceName);
    expect(createdWorkspace?.repos).toEqual([
      expect.objectContaining({
        sourceType: 'local',
        localPath: secondRepoDir,
        name: 'project-b',
        role: 'BE',
        kind: 'code',
      }),
    ]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('通过真实接口向现有工作区绑定本地仓库', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();

    render(
      <WorkspaceModal
        mode="add-repo"
        workspaceId={workspace.id}
        env={emptyEnv}
        onClose={vi.fn()}
        onCompleted={onCompleted}
      />,
    );

    await user.type(screen.getByLabelText('本地仓库 / Worktree 绝对路径'), secondRepoDir);
    await user.type(screen.getByLabelText('显示名（可选）'), 'project-b');
    await user.click(screen.getByRole('button', { name: '确认绑定' }));

    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith(workspace.id));
    const registry = await api.listWorkspaces();
    const updatedWorkspace = registry.workspaces.find((item) => item.id === workspace.id);
    expect(updatedWorkspace?.repos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'project-b', localPath: secondRepoDir }),
      ]),
    );
  });
});

describe('LocalFolderPickerModal', () => {
  it('读取真实目录数据并渲染空状态', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <LocalFolderPickerModal
        initialPath={emptyDir}
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    expect(await screen.findByText('当前目录下没有子文件夹')).toBeVisible();
    expect(screen.getByLabelText('当前目录')).toHaveValue(emptyDir);

    await user.click(screen.getByRole('button', { name: '选择当前目录' }));
    expect(onSelect).toHaveBeenCalledWith(emptyDir);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('IdeaModal', () => {
  it('关联表单标签并在只读状态禁用全部编辑操作', async () => {
    const user = userEvent.setup();
    const idea = await api.createIdea(workspace.id, {
      repoId: workspace.repos[0]?.id,
      title: '只读 Idea',
      description: '只读描述',
    });
    const onClose = vi.fn();

    render(
      <IdeaModal
        workspaceId={workspace.id}
        repos={workspace.repos}
        idea={idea}
        readOnly
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: '关联仓库（可选）' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: '标题' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: '描述' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '保存 Idea' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('将空选项哨兵转换为创建接口中的未关联仓库', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <IdeaModal
        workspaceId={workspace.id}
        repos={workspace.repos}
        idea={null}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    const repoSelect = screen.getByRole('combobox', { name: '关联仓库（可选）' });
    expect(repoSelect).toHaveTextContent('不限定仓库（工作区级灵感）');
    await user.type(screen.getByRole('textbox', { name: '标题' }), '  工作区级 Idea  ');
    await user.type(screen.getByRole('textbox', { name: '描述' }), '  不关联具体仓库  ');
    await user.click(screen.getByRole('button', { name: '保存 Idea' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const savedIdea = (await listIdeas(workspace.id)).find((item) => item.title === '工作区级 Idea');
    expect(savedIdea).toEqual(
      expect.objectContaining({
        title: '工作区级 Idea',
        description: '不关联具体仓库',
      }),
    );
    expect(savedIdea?.repoId).toBeUndefined();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('更新时转换空选项，并通过 AlertDialog 删除 Idea', async () => {
    const user = userEvent.setup();
    const idea = await api.createIdea(workspace.id, {
      repoId: workspace.repos[0]?.id,
      title: '待更新 Idea',
      description: '更新前描述',
    });
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <IdeaModal
        workspaceId={workspace.id}
        repos={workspace.repos}
        idea={idea}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    const repoSelect = screen.getByRole('combobox', { name: '关联仓库（可选）' });
    await chooseSelectOption(user, repoSelect, '不限定仓库（工作区级灵感）');
    expect(repoSelect).toHaveTextContent('不限定仓库（工作区级灵感）');

    const titleInput = screen.getByRole('textbox', { name: '标题' });
    await user.clear(titleInput);
    await user.type(titleInput, '已更新 Idea');
    await user.click(screen.getByRole('button', { name: '保存 Idea' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const updatedIdea = (await listIdeas(workspace.id)).find((item) => item.id === idea.id);
    expect(updatedIdea?.title).toBe('已更新 Idea');
    expect(updatedIdea?.repoId).toBeUndefined();

    const deleteButton = screen.getByRole('button', { name: '删除' });
    await user.click(deleteButton);
    const confirmation = screen.getByRole('alertdialog', { name: '删除 Idea？' });
    const cancelButton = within(confirmation).getByRole('button', { name: '取消' });
    expect(cancelButton).toHaveFocus();
    await user.click(cancelButton);
    await waitFor(() => expect(deleteButton).toHaveFocus());

    await user.click(deleteButton);
    await user.click(await screen.findByRole('button', { name: '确认删除' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
    expect((await listIdeas(workspace.id)).some((item) => item.id === idea.id)).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
