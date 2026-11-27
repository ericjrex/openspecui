/**
 * @file 跨仓 Git 状态卡片与混合活动时间线组件
 * @description 独立展示每个仓库的分支、脏状态、远程只读缓存同步状态，并汇总跨仓倒序提交时间线与只读代码 Diff。
 * @author ypc
 */

import type { GitCommitItem, GitDiffResult, GitRepoStatus, Workspace } from '@openspecui/shared';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { DiffViewer } from './DiffViewer';
import { CommitTimeline } from './git/CommitTimeline';
import { UNSELECTED_BRANCH_VALUE } from './git/BranchSelect';
import { RepoStatusCard } from './git/RepoStatusCard';

interface GitActivityViewProps {
  workspace: Workspace;
  gitStatuses: GitRepoStatus[];
  readOnlyMode?: boolean;
  onRefresh: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function GitActivityView({
  workspace,
  gitStatuses,
  readOnlyMode = false,
  onRefresh,
}: GitActivityViewProps) {
  const [commits, setCommits] = useState<GitCommitItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);
  const [switchingRepoId, setSwitchingRepoId] = useState<string | null>(null);
  const [removingRepoId, setRemovingRepoId] = useState<string | null>(null);
  const [branchErrors, setBranchErrors] = useState<Record<string, string>>({});
  const [repoActionErrors, setRepoActionErrors] = useState<Record<string, string>>({});
  const [selectedDiff, setSelectedDiff] = useState<GitDiffResult | null>(null);
  const [diffTitle, setDiffTitle] = useState('');
  const [diffError, setDiffError] = useState<string | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const loadTimeline = useCallback(async () => {
    setLoadingTimeline(true);
    setTimelineError(null);
    try {
      const response = await api.getGitTimeline(workspace.id);
      setCommits(response.commits);
    } catch (error) {
      setCommits([]);
      setTimelineError(getErrorMessage(error, '加载 Git 活动时间线失败'));
    } finally {
      setLoadingTimeline(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    setSelectedDiff(null);
    setDiffTitle('');
    setDiffError(null);
    setBranchErrors({});
    setRepoActionErrors({});
    void loadTimeline();
  }, [workspace.id, workspace.repos.length, loadTimeline]);

  const handleSyncRemote = async (repoId: string) => {
    setSyncingRepoId(repoId);
    setRepoActionErrors((previous) => {
      const next = { ...previous };
      delete next[repoId];
      return next;
    });
    try {
      const result = await api.syncRemoteRepo(workspace.id, repoId);
      const syncError = result.repo.lastError;
      if (syncError) {
        setRepoActionErrors((previous) => ({ ...previous, [repoId]: syncError }));
      }
      await loadTimeline();
      onRefresh();
    } catch (error) {
      setRepoActionErrors((previous) => ({
        ...previous,
        [repoId]: getErrorMessage(error, '同步远程缓存仓库失败'),
      }));
    } finally {
      setSyncingRepoId(null);
    }
  };

  const handleSwitchBranch = async (repoId: string, nextBranch: string, currentBranch: string) => {
    if (!nextBranch || nextBranch === currentBranch || nextBranch === UNSELECTED_BRANCH_VALUE || readOnlyMode) {
      return;
    }
    setSwitchingRepoId(repoId);
    setBranchErrors((previous) => {
      const next = { ...previous };
      delete next[repoId];
      return next;
    });
    try {
      await api.checkoutBranch(repoId, nextBranch);
      await loadTimeline();
      onRefresh();
    } catch (error) {
      setBranchErrors((previous) => ({
        ...previous,
        [repoId]: getErrorMessage(error, '切换分支失败'),
      }));
    } finally {
      setSwitchingRepoId(null);
    }
  };

  const handleRemoveRepo = async (repoId: string, cleanupCache: boolean) => {
    setRemovingRepoId(repoId);
    setRepoActionErrors((previous) => {
      const next = { ...previous };
      delete next[repoId];
      return next;
    });
    try {
      await api.removeRepo(workspace.id, repoId, cleanupCache);
      onRefresh();
    } catch (error) {
      setRepoActionErrors((previous) => ({
        ...previous,
        [repoId]: getErrorMessage(error, '解绑仓库失败'),
      }));
    } finally {
      setRemovingRepoId(null);
    }
  };

  const handleInspectDiff = async (repoId: string, target: string, title: string) => {
    setLoadingDiff(true);
    setDiffTitle(title);
    setDiffError(null);
    setSelectedDiff(null);
    try {
      const diff = await api.getRepoDiff(repoId, target);
      setSelectedDiff(diff);
    } catch (error) {
      setDiffError(getErrorMessage(error, '加载代码 Diff 失败'));
    } finally {
      setLoadingDiff(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {workspace.repos.map((repo) => {
          const status = gitStatuses.find((item) => item.repoId === repo.id);
          const isSyncing =
            syncingRepoId === repo.id || repo.syncState === 'cloning' || repo.syncState === 'syncing';

          return (
            <RepoStatusCard
              key={repo.id}
              repo={repo}
              status={status}
              readOnlyMode={readOnlyMode}
              syncing={isSyncing}
              switching={switchingRepoId === repo.id}
              removing={removingRepoId === repo.id}
              branchError={branchErrors[repo.id]}
              actionError={repoActionErrors[repo.id]}
              onCloseBranchError={() =>
                setBranchErrors((previous) => {
                  const next = { ...previous };
                  delete next[repo.id];
                  return next;
                })
              }
              onSwitchBranch={(branch) => void handleSwitchBranch(repo.id, branch, status?.branch ?? '')}
              onSync={() => void handleSyncRemote(repo.id)}
              onInspectDiff={() =>
                void handleInspectDiff(repo.id, 'working-tree', `[${repo.role}] ${repo.name} 未提交改动`)
              }
              onUnbind={(cleanupCache) => handleRemoveRepo(repo.id, cleanupCache)}
            />
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <CommitTimeline
          commits={commits}
          loading={loadingTimeline}
          error={timelineError}
          onRefresh={() => void loadTimeline()}
          onInspect={(commit) =>
            void handleInspectDiff(
              commit.repoId,
              commit.sha,
              `[${commit.repoRole}] ${commit.shortSha} · ${commit.subject}`,
            )
          }
        />

        <Card className="min-w-0 lg:col-span-3" aria-busy={loadingDiff}>
          <CardHeader>
            <CardTitle>代码 Diff</CardTitle>
            <CardDescription>只读查看未提交工作区或历史 Commit 的文件差异。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {diffError && (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>加载代码 Diff 失败</AlertTitle>
                <AlertDescription>{diffError}</AlertDescription>
              </Alert>
            )}
            <DiffViewer diff={selectedDiff} loading={loadingDiff} title={diffTitle} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
