import type { GitRepoStatus, RepoBinding } from '@openspecui/shared';
import { AlertTriangle, FileDiff, GitBranch, Globe, Lock, RefreshCw, X } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { BranchSelect } from './BranchSelect';
import { UnbindRepoDialog } from './UnbindRepoDialog';

interface RepoStatusCardProps {
  repo: RepoBinding;
  status?: GitRepoStatus;
  readOnlyMode: boolean;
  syncing: boolean;
  switching: boolean;
  removing: boolean;
  branchError?: string;
  actionError?: string;
  onCloseBranchError: () => void;
  onSwitchBranch: (branch: string) => void;
  onSync: () => void;
  onInspectDiff: () => void;
  onUnbind: (cleanupCache: boolean) => Promise<void>;
}

export function RepoStatusCard({
  repo,
  status,
  readOnlyMode,
  syncing,
  switching,
  removing,
  branchError,
  actionError,
  onCloseBranchError,
  onSwitchBranch,
  onSync,
  onInspectDiff,
  onUnbind,
}: RepoStatusCardProps) {
  const isRemote = repo.sourceType === 'remote';

  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="secondary">{repo.role}</Badge>
          <CardTitle className="truncate">{repo.name}</CardTitle>
        </div>
        <CardDescription className="truncate font-mono text-xs" title={repo.remoteUrl ?? repo.localPath}>
          {repo.remoteUrl ?? repo.localPath}
        </CardDescription>
        {!readOnlyMode && (
          <CardAction>
            <UnbindRepoDialog repo={repo} pending={removing} onConfirm={onUnbind} />
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {isRemote ? (
            <Badge variant="secondary">
              <Globe data-icon="inline-start" aria-hidden="true" />
              <Lock data-icon="inline-end" aria-hidden="true" />
              线上只读缓存
            </Badge>
          ) : (
            <Badge variant="outline">本地仓库</Badge>
          )}
          {repo.declaredStoreId && <Badge variant="outline">Store: {repo.declaredStoreId}</Badge>}
        </div>

        {status?.isGitRepo ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!readOnlyMode && status.branches.length > 0 ? (
                <BranchSelect
                  repoName={repo.name}
                  status={status}
                  disabled={switching || syncing}
                  switching={switching}
                  onChange={onSwitchBranch}
                />
              ) : (
                <Badge variant="outline" className="max-w-full font-mono">
                  <GitBranch aria-hidden="true" />
                  <span className="truncate">{status.branch || '未知分支'}</span>
                </Badge>
              )}
              {(status.ahead > 0 || status.behind > 0) && (
                <span className="font-mono text-xs text-muted-foreground">
                  ↑{status.ahead} ↓{status.behind}
                </span>
              )}
              {status.dirtyCount > 0 && (
                <Button type="button" variant="outline" size="xs" onClick={onInspectDiff}>
                  <FileDiff data-icon="inline-start" aria-hidden="true" />
                  {status.dirtyCount} 个未提交改动
                </Button>
              )}
            </div>

            {branchError && (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>分支切换失败</AlertTitle>
                <AlertDescription className="break-all">{branchError}</AlertDescription>
                <AlertAction>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`关闭 ${repo.name} 分支错误`}
                    onClick={onCloseBranchError}
                  >
                    <X data-icon="inline-start" aria-hidden="true" />
                  </Button>
                </AlertAction>
              </Alert>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{status?.error || '未初始化 Git'}</p>
        )}

        {repo.lastError && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>仓库状态错误</AlertTitle>
            <AlertDescription className="break-all">{repo.lastError}</AlertDescription>
          </Alert>
        )}

        {actionError && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>仓库操作失败</AlertTitle>
            <AlertDescription className="break-all">{actionError}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {isRemote && (
        <CardFooter className="justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {repo.lastSyncedAt
              ? `上次同步：${new Date(repo.lastSyncedAt).toLocaleTimeString()}`
              : '尚未同步'}
          </span>
          {!readOnlyMode && (
            <Button type="button" variant="outline" size="xs" disabled={syncing} onClick={onSync}>
              {syncing ? (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              ) : (
                <RefreshCw data-icon="inline-start" aria-hidden="true" />
              )}
              {syncing ? '同步中...' : '立即同步'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
