/**
 * @file OpenSpecUI 主应用工作台组件
 * @description 管理全局工作区、WebSocket 刷新、主视图和顶层弹窗编排。
 */

import type { OpenSpecEnvironmentInfo, RegistryStoreData, WorkspaceIdea } from '@openspecui/shared';
import { useCallback, useEffect, useState } from 'react';
import { api, connectWorkbenchSocket, type WorkspaceOverviewResponse } from './api';
import { ChangeBoard } from './components/ChangeBoard';
import { ChangeDetailView } from './components/ChangeDetailView';
import { GitActivityView } from './components/GitActivityView';
import { IdeaModal } from './components/IdeaModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { EmptyState } from './components/common/EmptyState';
import { InlineAlert } from './components/common/InlineAlert';
import { LoadingState } from './components/common/LoadingState';
import { AppHeader } from './components/layout/AppHeader';
import { MobileAccessDialog } from './components/layout/MobileAccessDialog';
import { ReadOnlyBanner } from './components/layout/ReadOnlyBanner';
import { WorkspaceDeleteDialog } from './components/layout/WorkspaceDeleteDialog';
import { Button } from './components/ui/button';

export function App() {
  const [registry, setRegistry] = useState<RegistryStoreData | null>(null);
  const [env, setEnv] = useState<OpenSpecEnvironmentInfo>({
    cliAvailable: false,
    stores: [],
    worksets: [],
  });
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [lanUrls, setLanUrls] = useState<string[]>([]);
  const [overview, setOverview] = useState<WorkspaceOverviewResponse | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ groupKey: string; focusRepoId?: string } | null>(null);
  const [ideaTarget, setIdeaTarget] = useState<WorkspaceIdea | null | undefined>(undefined);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mainView, setMainView] = useState<'openspec' | 'git'>('openspec');
  const [modalMode, setModalMode] = useState<'create-workspace' | 'add-repo' | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const loadWorkspaceData = useCallback(async (targetWorkspaceId?: string | null) => {
    try {
      const reg = await api.listWorkspaces();
      setRegistry(reg);
      const activeId = targetWorkspaceId ?? reg.activeWorkspaceId ?? reg.workspaces[0]?.id ?? null;
      if (activeId) {
        const data = await api.getOverview(activeId);
        setOverview(data);
      } else {
        setOverview(null);
      }
      setErrorBanner(null);
    } catch (err) {
      setErrorBanner((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cleanupWs: (() => void) | undefined;

    void (async () => {
      try {
        const session = await api.initSession();
        setReadOnlyMode(session.readOnlyMode);
        setLanUrls(session.lanUrls);

        void api
          .getEnv()
          .then((res) => setEnv(res.env))
          .catch(() => {});

        await loadWorkspaceData(session.activeWorkspaceId);

        cleanupWs = connectWorkbenchSocket((msg) => {
          if (msg.type === 'workspace:refresh' || msg.type === 'remote:sync-status') {
            void loadWorkspaceData();
          }
        });
      } catch (err) {
        setErrorBanner((err as Error).message);
        setLoading(false);
      }
    })();

    return () => {
      cleanupWs?.();
    };
  }, [loadWorkspaceData]);

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (readOnlyMode) {
      await loadWorkspaceData(workspaceId);
      return;
    }
    await api.activateWorkspace(workspaceId);
    await loadWorkspaceData(workspaceId);
  };

  const handleDeleteWorkspace = async (cleanupCache: boolean) => {
    if (!overview || readOnlyMode) return;
    const result = await api.deleteWorkspace(overview.workspace.id, cleanupCache);
    setShowDeleteDialog(false);
    await loadWorkspaceData(result.activeWorkspaceId);
  };

  const activeGroup = detailTarget
    ? overview?.changeGroups.find((group) => group.key === detailTarget.groupKey) ?? null
    : null;
  const hasRemoteRepos = overview?.workspace.repos.some((repo) => repo.sourceType === 'remote') ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {readOnlyMode && <ReadOnlyBanner />}

      <AppHeader
        registry={registry}
        overview={overview}
        env={env}
        readOnlyMode={readOnlyMode}
        mainView={mainView}
        onMainViewChange={setMainView}
        onSwitchWorkspace={(workspaceId) => void handleSwitchWorkspace(workspaceId)}
        onCreateWorkspace={() => setModalMode('create-workspace')}
        onAddRepo={() => setModalMode('add-repo')}
        onDeleteWorkspace={() => setShowDeleteDialog(true)}
        onShowMobile={() => setShowMobileModal(true)}
        onRefresh={() => void loadWorkspaceData()}
      />

      <main className="w-full flex-1 space-y-5 px-4 py-4 md:px-6">
        {errorBanner && (
          <InlineAlert variant="destructive" className="items-center justify-between">
            <span>{errorBanner}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setLoading(true);
                void loadWorkspaceData();
              }}
            >
              重试
            </Button>
          </InlineAlert>
        )}

        {loading ? (
          <LoadingState label="正在连接本地工作台并加载工作区..." className="p-12" />
        ) : !overview ? (
          <EmptyState
            title="欢迎使用 OpenSpecUI"
            description="创建一个逻辑工作区，绑定本地仓库、前后端分仓或线上 Git URL，立即统一预览 Specs 与 Git 变更。"
            action={
              !readOnlyMode ? (
                <Button onClick={() => setModalMode('create-workspace')}>创建第一个工作区</Button>
              ) : undefined
            }
          />
        ) : mainView === 'openspec' ? (
          <ChangeBoard
            workspace={overview.workspace}
            changeGroups={overview.changeGroups}
            mainSpecs={overview.mainSpecs}
            readOnlyMode={readOnlyMode}
            onOpenDetail={(groupKey, focusRepoId) => setDetailTarget({ groupKey, focusRepoId })}
            onOpenIdeaModal={(idea) => setIdeaTarget(idea)}
            onRefresh={() => void loadWorkspaceData()}
          />
        ) : (
          <GitActivityView
            workspace={overview.workspace}
            gitStatuses={overview.gitStatuses}
            readOnlyMode={readOnlyMode}
            onRefresh={() => void loadWorkspaceData()}
          />
        )}
      </main>

      {activeGroup && overview && (
        <ChangeDetailView
          workspaceId={overview.workspace.id}
          group={activeGroup}
          repoLinks={overview.workspace.repoLinks}
          initialRepoId={detailTarget?.focusRepoId}
          readOnlyMode={readOnlyMode}
          onClose={() => setDetailTarget(null)}
          onRefresh={() => void loadWorkspaceData()}
        />
      )}

      {ideaTarget !== undefined && overview && (
        <IdeaModal
          workspaceId={overview.workspace.id}
          repos={overview.workspace.repos}
          idea={ideaTarget}
          readOnly={readOnlyMode}
          onClose={() => setIdeaTarget(undefined)}
          onSaved={() => void loadWorkspaceData()}
        />
      )}

      {modalMode && !readOnlyMode && (
        <WorkspaceModal
          mode={modalMode}
          workspaceId={overview?.workspace.id}
          env={env}
          onClose={() => setModalMode(null)}
          onCompleted={(id) => void loadWorkspaceData(id)}
        />
      )}

      <MobileAccessDialog open={showMobileModal} onOpenChange={setShowMobileModal} readOnlyMode={readOnlyMode} lanUrls={lanUrls} />

      {overview && (
        <WorkspaceDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          workspaceName={overview.workspace.name}
          hasRemote={hasRemoteRepos}
          onConfirm={(cleanupCache) => void handleDeleteWorkspace(cleanupCache)}
        />
      )}
    </div>
  );
}

export default App;
