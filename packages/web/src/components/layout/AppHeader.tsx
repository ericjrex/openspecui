import type { OpenSpecEnvironmentInfo, RegistryStoreData } from '@openspecui/shared';
import { FolderPlus, GitBranch, Layers, Plus, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import type { WorkspaceOverviewResponse } from '../../api';
import { ThemeToggle } from '../common/ThemeToggle';
import { IconButton } from '../common/IconButton';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

const NO_WORKSPACE = '__no-workspace__';

interface AppHeaderProps {
  registry: RegistryStoreData | null;
  overview: WorkspaceOverviewResponse | null;
  env: OpenSpecEnvironmentInfo;
  readOnlyMode: boolean;
  mainView: 'openspec' | 'git';
  onMainViewChange: (view: 'openspec' | 'git') => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  onAddRepo: () => void;
  onDeleteWorkspace: () => void;
  onShowMobile: () => void;
  onRefresh: () => void;
}

export function AppHeader({
  registry,
  overview,
  env,
  readOnlyMode,
  mainView,
  onMainViewChange,
  onSwitchWorkspace,
  onCreateWorkspace,
  onAddRepo,
  onDeleteWorkspace,
  onShowMobile,
  onRefresh,
}: AppHeaderProps) {
  const workspaces = registry?.workspaces ?? [];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 font-semibold text-info">
            <Layers aria-hidden="true" className="size-5" />
            <span>OpenSpecUI</span>
          </div>

          <Select value={overview?.workspace.id ?? NO_WORKSPACE} onValueChange={(value) => value !== NO_WORKSPACE && onSwitchWorkspace(value)} disabled={workspaces.length === 0}>
            <SelectTrigger className="min-w-44 border-border-strong bg-card px-3 py-1.5 text-xs font-medium" aria-label="切换工作区">
              <SelectValue placeholder="暂无工作区" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.length === 0 && <SelectItem value={NO_WORKSPACE} disabled>暂无工作区</SelectItem>}
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name} ({workspace.repos.length} 仓)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!readOnlyMode && (
            <>
              <Button size="sm" onClick={onCreateWorkspace}>
                <Plus data-icon="inline-start" aria-hidden="true" /> 新建工作区
              </Button>
              {overview && (
                <>
                  <Button variant="outline" size="sm" onClick={onAddRepo}>
                    <FolderPlus data-icon="inline-start" aria-hidden="true" className="text-info" /> 绑定仓库 / 线上 Git
                  </Button>
                  <IconButton label="删除当前工作区" variant="ghost" size="icon-sm" className="text-muted-foreground hover:border-destructive/40 hover:text-destructive" onClick={onDeleteWorkspace}>
                    <Trash2 aria-hidden="true" />
                  </IconButton>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {overview?.gitStatuses.map((status) => (
            <div key={status.repoId} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-11">
              <span className="font-semibold text-info">[{status.repoRole}]</span>
              <GitBranch aria-hidden="true" className="size-3 text-muted-foreground" />
              <span className="font-mono text-foreground-secondary">{status.branch}</span>
              {status.dirtyCount > 0 && <span className="rounded bg-warning/20 px-1 text-10 text-warning">*{status.dirtyCount}</span>}
            </div>
          ))}

          <IconButton label="在手机/局域网打开" variant="outline" size="icon-sm" onClick={onShowMobile}>
            <Smartphone aria-hidden="true" />
          </IconButton>
          <ThemeToggle />
          <IconButton label="刷新工作区" variant="outline" size="icon-sm" onClick={onRefresh}>
            <RefreshCw aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {overview && (
        <div className="flex w-full items-center justify-between border-t border-border px-4 py-2 text-xs md:px-6">
          <Tabs value={mainView} onValueChange={(value) => onMainViewChange(value as 'openspec' | 'git')}>
            <TabsList variant="line">
              <TabsTrigger value="openspec">OpenSpec 看板与规范</TabsTrigger>
              <TabsTrigger value="git">多仓 Git 状态与活动流 ({overview.workspace.repos.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-11 text-muted-foreground">
            {env.cliAvailable ? `OpenSpec CLI ${env.cliVersion}` : 'OpenSpec CLI 未检测到（文件直读模式）'}
          </div>
        </div>
      )}
    </header>
  );
}
