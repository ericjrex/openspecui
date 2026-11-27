/**
 * @file 工作区创建、目录扫描与线上 Git URL 导入弹窗
 * @description 支持新建逻辑工作区、扫描本地目录发现仓库、导入原生 OpenSpec Workset/Store 以及添加线上 HTTPS/SSH Git 仓库。
 * @author ypc
 */

import type {
  AddRepoInput,
  DiscoveredRepoCandidate,
  OpenSpecEnvironmentInfo,
  RepoKind,
} from '@openspecui/shared';
import { FolderOpen, FolderSearch, Globe, Layers, MonitorUp, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '@/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalFolderPickerModal } from '@/components/LocalFolderPickerModal';
import { RepoKindSelect } from './workspace/RepoKindSelect';

interface WorkspaceModalProps {
  mode: 'create-workspace' | 'add-repo';
  workspaceId?: string;
  env: OpenSpecEnvironmentInfo;
  onClose: () => void;
  onCompleted: (workspaceId?: string) => void;
}

type SourceTab = 'local' | 'remote' | 'scan' | 'workset';

export function WorkspaceModal({
  mode,
  workspaceId,
  env,
  onClose,
  onCompleted,
}: WorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [sourceTab, setSourceTab] = useState<SourceTab>('local');

  // 本地或远程表单字段
  const [localPath, setLocalPath] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [role, setRole] = useState('FE');
  const [kind, setKind] = useState<RepoKind>('hybrid');
  const [autoSyncMinutes, setAutoSyncMinutes] = useState(0);

  // 待提交仓库草稿（创建工作区模式下可一次加多个仓，如前后端双仓）
  const [draftRepos, setDraftRepos] = useState<AddRepoInput[]>([]);

  // 扫描目录状态（默认仅扫描 OpenSpec 项目，且默认不自动全选）
  const [scanRoot, setScanRoot] = useState('');
  const [onlyOpenSpec, setOnlyOpenSpec] = useState(true);
  const [candidates, setCandidates] = useState<DiscoveredRepoCandidate[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [hasScanned, setHasScanned] = useState(false);

  // 本机目录浏览 / 系统原生文件夹弹窗状态
  const [folderPickerTarget, setFolderPickerTarget] = useState<'localPath' | 'scanRoot' | null>(null);
  const [pickingNative, setPickingNative] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [configDirPath, setConfigDirPath] = useState('');

  const returnFocusTarget = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  const handleCloseAutoFocus = (event: Event) => {
    const target = returnFocusTarget.current;
    if (target?.isConnected && target !== document.body) {
      event.preventDefault();
      target.focus();
    }
  };

  const runScan = async (targetRoot: string, filterOpenSpec: boolean) => {
    if (!targetRoot.trim()) {
      setErrorMsg('请先输入或选择要扫描的父级目录');
      return;
    }
    setErrorMsg(null);
    try {
      const res = await api.discoverRepos(targetRoot.trim(), 2, filterOpenSpec);
      setCandidates(res.candidates);
      // 默认不自动全部勾选，由用户显式挑选
      setSelectedPaths(new Set());
      setHasScanned(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleScan = async () => {
    await runScan(scanRoot, onlyOpenSpec);
  };

  const handleNativeFolderPick = async (target: 'localPath' | 'scanRoot') => {
    setErrorMsg(null);
    setPickingNative(true);
    try {
      const current = target === 'localPath' ? localPath : scanRoot;
      const res = await api.pickFolder(current.trim() || undefined);
      if (!res.cancelled && res.path) {
        if (target === 'localPath') {
          setLocalPath(res.path);
        } else {
          setScanRoot(res.path);
          await runScan(res.path, onlyOpenSpec);
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setPickingNative(false);
    }
  };

  const handleAddDraftFromForm = () => {
    setErrorMsg(null);
    if (sourceTab === 'local') {
      if (!localPath.trim()) {
        setErrorMsg('请输入本地仓库绝对路径');
        return;
      }
      setDraftRepos((prev) => [
        ...prev,
        {
          sourceType: 'local',
          localPath: localPath.trim(),
          name: repoName.trim() || undefined,
          role: role.trim() || 'CODE',
          kind,
        },
      ]);
      setLocalPath('');
      setRepoName('');
    } else if (sourceTab === 'remote') {
      if (!remoteUrl.trim()) {
        setErrorMsg('请输入 HTTPS 或 SSH Git 地址');
        return;
      }
      setDraftRepos((prev) => [
        ...prev,
        {
          sourceType: 'remote',
          remoteUrl: remoteUrl.trim(),
          name: repoName.trim() || undefined,
          role: role.trim() || 'REMOTE',
          kind,
          autoSyncIntervalMinutes: autoSyncMinutes,
        },
      ]);
      setRemoteUrl('');
      setRepoName('');
    } else if (sourceTab === 'scan') {
      const picked = candidates.filter((candidate) => selectedPaths.has(candidate.path));
      if (picked.length === 0) {
        setErrorMsg('请至少勾选一个扫描到的仓库');
        return;
      }
      setDraftRepos((prev) => [
        ...prev,
        ...picked.map((candidate) => ({
          sourceType: 'local' as const,
          localPath: candidate.path,
          name: candidate.name,
          role: candidate.name.toUpperCase().slice(0, 12),
          kind: 'hybrid' as const,
        })),
      ]);
      setCandidates([]);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (mode === 'create-workspace') {
        if (!workspaceName.trim()) {
          throw new Error('请输入逻辑工作区名称');
        }
        let reposToCreate = [...draftRepos];
        // 若用户没先点“加入列表”直接提交单仓表单，自动补入
        if (reposToCreate.length === 0) {
          if (sourceTab === 'local' && localPath.trim()) {
            reposToCreate = [
              {
                sourceType: 'local',
                localPath: localPath.trim(),
                name: repoName.trim() || undefined,
                role: role.trim() || 'MAIN',
                kind,
              },
            ];
          } else if (sourceTab === 'remote' && remoteUrl.trim()) {
            reposToCreate = [
              {
                sourceType: 'remote',
                remoteUrl: remoteUrl.trim(),
                name: repoName.trim() || undefined,
                role: role.trim() || 'REMOTE',
                kind,
                autoSyncIntervalMinutes: autoSyncMinutes,
              },
            ];
          } else if (sourceTab === 'scan' && selectedPaths.size > 0) {
            reposToCreate = candidates
              .filter((candidate) => selectedPaths.has(candidate.path))
              .map((candidate) => ({
                sourceType: 'local' as const,
                localPath: candidate.path,
                name: candidate.name,
                role: candidate.name.toUpperCase().slice(0, 12),
                kind: 'hybrid' as const,
              }));
          }
        }
        const created = await api.createWorkspace({
          name: workspaceName.trim(),
          repos: reposToCreate,
        });
        onCompleted(created.id);
      } else if (workspaceId) {
        if (sourceTab === 'local') {
          await api.addRepo(workspaceId, {
            sourceType: 'local',
            localPath: localPath.trim(),
            name: repoName.trim() || undefined,
            role: role.trim() || 'CODE',
            kind,
          });
        } else if (sourceTab === 'remote') {
          await api.addRepo(workspaceId, {
            sourceType: 'remote',
            remoteUrl: remoteUrl.trim(),
            name: repoName.trim() || undefined,
            role: role.trim() || 'REMOTE',
            kind,
            autoSyncIntervalMinutes: autoSyncMinutes,
          });
        } else if (sourceTab === 'scan') {
          for (const candidate of candidates.filter((item) => selectedPaths.has(item.path))) {
            await api.addRepo(workspaceId, {
              sourceType: 'local',
              localPath: candidate.path,
              name: candidate.name,
              role: candidate.name.toUpperCase().slice(0, 12),
              kind: 'hybrid',
            });
          }
        }
        onCompleted(workspaceId);
      }
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportOpenSpecUiJson = async () => {
    if (!configDirPath.trim()) {
      setErrorMsg('请输入包含 openspec-ui.json 的目录路径');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const workspace = await api.importOpenSpecUiJson(configDirPath.trim());
      onCompleted(workspace.id);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportWorkset = async (name: string, members: string[]) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const workspace = await api.importWorkset(name, members);
      onCompleted(workspace.id);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const sourceTabs = [
    { id: 'local', label: '本地目录路径', icon: Plus },
    { id: 'remote', label: '线上 Git 地址（只读缓存）', icon: Globe },
    { id: 'scan', label: '扫描本地目录', icon: FolderSearch },
    ...(mode === 'create-workspace'
      ? [{ id: 'workset', label: `OpenSpec Workset/Store (${env.worksets.length + env.stores.length})`, icon: Layers }]
      : []),
  ];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden bg-card p-0 text-foreground"
        showCloseButton={false}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader className="shrink-0 px-5 py-3.5 pr-14">
          <DialogTitle>
            {mode === 'create-workspace' ? '新建逻辑工作区（支持单仓 / 前后端多仓 / 线上 Git）' : '向当前工作区绑定仓库'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            填写逻辑工作区与仓库信息，或导入本机 OpenSpec 资源。
          </DialogDescription>
        </DialogHeader>

        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label="关闭工作区弹窗"
          >
            <X aria-hidden="true" />
          </Button>
        </DialogClose>

        <ScrollArea className="min-h-0 flex-1 basis-[min(75vh,40rem)]">
          <div className="flex flex-col gap-4 p-5 text-sm">
            {mode === 'create-workspace' && (
              <Field>
                <FieldLabel htmlFor="workspace-name">逻辑工作区名称</FieldLabel>
                <Input
                  id="workspace-name"
                  type="text"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="例如：电商系统（前后端联合）"
                />
              </Field>
            )}

            <Tabs value={sourceTab} onValueChange={(value) => setSourceTab(value as SourceTab)}>
              <TabsList
                variant="line"
                aria-label="仓库来源"
                className="w-full justify-start overflow-x-auto rounded-none border-b border-border"
              >
                {sourceTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="shrink-0 px-3 text-xs">
                      <Icon data-icon="inline-start" aria-hidden="true" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="local" className="flex flex-col gap-3">
                <Field>
                  <FieldLabel htmlFor="workspace-local-path">本地仓库 / Worktree 绝对路径</FieldLabel>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="workspace-local-path"
                      type="text"
                      value={localPath}
                      onChange={(event) => setLocalPath(event.target.value)}
                      placeholder="例如：D:\code\shop-web"
                      className="min-w-0 flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFolderPickerTarget('localPath')}
                      title="在网页内浏览本机盘符与目录树"
                    >
                      <FolderOpen data-icon="inline-start" aria-hidden="true" className="text-info" />
                      浏览目录
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pickingNative}
                      onClick={() => void handleNativeFolderPick('localPath')}
                      title="调用操作系统文件夹选择弹窗"
                    >
                      {pickingNative ? (
                        <Spinner data-icon="inline-start" aria-hidden="true" />
                      ) : (
                        <MonitorUp data-icon="inline-start" aria-hidden="true" className="text-success" />
                      )}
                      {pickingNative ? '等待选择...' : '系统弹窗'}
                    </Button>
                  </div>
                </Field>

                <FieldGroup className="gap-2 sm:grid sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="workspace-local-name">显示名（可选）</FieldLabel>
                    <Input
                      id="workspace-local-name"
                      type="text"
                      value={repoName}
                      onChange={(event) => setRepoName(event.target.value)}
                      placeholder="自动取目录名"
                      className="text-xs"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="workspace-local-role">角色标签</FieldLabel>
                    <Input
                      id="workspace-local-role"
                      type="text"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      placeholder="FE / BE / STORE"
                      className="text-xs"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="workspace-local-kind">仓库类型</FieldLabel>
                    <RepoKindSelect
                      id="workspace-local-kind"
                      value={kind}
                      onValueChange={setKind}
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="remote" className="flex flex-col gap-3">
                <Alert className="border-info/30 bg-diff-info text-info">
                  <AlertTitle>远程仓库只读缓存</AlertTitle>
                  <AlertDescription className="text-info">
                    仅放行 https://、http://、ssh://、git@host:repo 格式；克隆至本地受控缓存目录并保持只读，复用本机 SSH Key / Git 凭证。
                  </AlertDescription>
                </Alert>

                <Field>
                  <FieldLabel htmlFor="workspace-remote-url">线上 Git 地址</FieldLabel>
                  <Input
                    id="workspace-remote-url"
                    type="text"
                    value={remoteUrl}
                    onChange={(event) => setRemoteUrl(event.target.value)}
                    placeholder="https://github.com/org/repo.git 或 git@gitlab.com:org/repo.git"
                    className="font-mono text-xs"
                  />
                </Field>

                <FieldGroup className="gap-2 sm:grid sm:grid-cols-4">
                  <Field>
                    <FieldLabel htmlFor="workspace-remote-name">显示名（可选）</FieldLabel>
                    <Input
                      id="workspace-remote-name"
                      type="text"
                      value={repoName}
                      onChange={(event) => setRepoName(event.target.value)}
                      className="text-xs"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="workspace-remote-role">角色标签</FieldLabel>
                    <Input
                      id="workspace-remote-role"
                      type="text"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      className="text-xs"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="workspace-remote-kind">仓库类型</FieldLabel>
                    <RepoKindSelect
                      id="workspace-remote-kind"
                      value={kind}
                      onValueChange={setKind}
                      remote
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="workspace-auto-sync">自动同步(分钟)</FieldLabel>
                    <Input
                      id="workspace-auto-sync"
                      type="number"
                      min={0}
                      max={1440}
                      value={autoSyncMinutes}
                      onChange={(event) => setAutoSyncMinutes(Number(event.target.value) || 0)}
                      placeholder="0=手动"
                      className="text-xs"
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="scan" className="flex flex-col gap-3">
                <Field>
                  <FieldLabel htmlFor="workspace-scan-root">扫描父目录</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="workspace-scan-root"
                      type="text"
                      value={scanRoot}
                      onChange={(event) => setScanRoot(event.target.value)}
                      placeholder="输入或选择父目录路径，例如 D:\code"
                      className="min-w-[200px] flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFolderPickerTarget('scanRoot')}
                    >
                      <FolderOpen data-icon="inline-start" aria-hidden="true" className="text-info" />
                      浏览目录
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pickingNative}
                      onClick={() => void handleNativeFolderPick('scanRoot')}
                    >
                      {pickingNative ? (
                        <Spinner data-icon="inline-start" aria-hidden="true" />
                      ) : (
                        <MonitorUp data-icon="inline-start" aria-hidden="true" className="text-success" />
                      )}
                      系统弹窗
                    </Button>
                    <Button type="button" size="sm" onClick={() => void handleScan()}>
                      扫描
                    </Button>
                  </div>
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <Field orientation="horizontal">
                    <Checkbox
                      id="workspace-only-openspec"
                      checked={onlyOpenSpec}
                      onCheckedChange={(checked) => {
                        const next = checked === true;
                        setOnlyOpenSpec(next);
                        if (scanRoot.trim()) {
                          void runScan(scanRoot, next);
                        }
                      }}
                    />
                    <FieldLabel htmlFor="workspace-only-openspec" className="font-normal">
                      仅显示 OpenSpec 项目（过滤无 openspec/ 的纯 Git 仓）
                    </FieldLabel>
                  </Field>

                  {candidates.length > 0 && (
                    <div className="flex items-center gap-2 text-11">
                      <span className="text-muted-foreground">
                        共 {candidates.length} 个，已选 {selectedPaths.size} 个
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        onClick={() => setSelectedPaths(new Set(candidates.map((candidate) => candidate.path)))}
                      >
                        全选
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        onClick={() => setSelectedPaths(new Set())}
                      >
                        清空
                      </Button>
                    </div>
                  )}
                </div>

                {hasScanned && candidates.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/30 p-6">
                    <EmptyHeader>
                      <EmptyTitle>未发现符合条件的项目</EmptyTitle>
                      <EmptyDescription>可检查目录深度或取消“仅显示 OpenSpec 项目”</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}

                {candidates.length > 0 && (
                  <ScrollArea className="h-48 rounded-lg border border-border bg-input p-1.5">
                    <div className="flex flex-col gap-1">
                      {candidates.map((candidate, index) => {
                        const checked = selectedPaths.has(candidate.path);
                        const checkboxId = `workspace-scan-candidate-${index}`;
                        return (
                          <Field
                            key={candidate.path}
                            orientation="horizontal"
                            className="rounded-md px-2 py-1 hover:bg-muted"
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              onCheckedChange={() => {
                                setSelectedPaths((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(candidate.path)) next.delete(candidate.path);
                                  else next.add(candidate.path);
                                  return next;
                                });
                              }}
                            />
                            <FieldLabel htmlFor={checkboxId} className="min-w-0 flex-1 font-normal">
                              <span className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{candidate.name}</span>
                                <span className="truncate font-mono text-11 text-muted-foreground">{candidate.path}</span>
                              </span>
                              <span className="flex shrink-0 gap-1">
                                {candidate.hasOpenSpec && (
                                  <Badge variant="secondary" className="text-success">OpenSpec</Badge>
                                )}
                                {candidate.hasGit && (
                                  <Badge variant="secondary" className="text-info">Git</Badge>
                                )}
                              </span>
                            </FieldLabel>
                          </Field>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="workset" className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-input p-3">
                  <div className="text-xs font-semibold text-foreground">导入 openspec-ui.json 配置文件</div>
                  <Field>
                    <FieldLabel htmlFor="workspace-config-dir" className="sr-only">
                      openspec-ui.json 所在目录
                    </FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="workspace-config-dir"
                        type="text"
                        value={configDirPath}
                        onChange={(event) => setConfigDirPath(event.target.value)}
                        placeholder="输入含 openspec-ui.json 的目录路径"
                        className="flex-1 font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={submitting}
                        onClick={() => void handleImportOpenSpecUiJson()}
                      >
                        导入配置
                      </Button>
                    </div>
                  </Field>
                </div>

                {env.worksets.length === 0 && env.stores.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/30 p-6">
                    <EmptyHeader>
                      <EmptyTitle>本机暂无已注册的 OpenSpec Workset 或 Store</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-2">
                    {env.worksets.map((workset) => (
                      <div key={workset.name} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-input p-3">
                        <div>
                          <div className="text-xs font-semibold text-foreground">Workset: {workset.name}</div>
                          <div className="text-11 text-muted-foreground">{workset.members.length} 个成员目录</div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleImportWorkset(workset.name, workset.members)}
                        >
                          一键导入
                        </Button>
                      </div>
                    ))}
                    {env.stores.map((store) => (
                      <div key={store.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-input p-3">
                        <div>
                          <div className="text-xs font-semibold text-foreground">Store: {store.id}</div>
                          <div className="font-mono text-11 text-muted-foreground">{store.path}</div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleImportWorkset(`store-${store.id}`, [store.path])}
                        >
                          作为工作区导入
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {mode === 'create-workspace' && sourceTab !== 'workset' && (
              <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleAddDraftFromForm}>
                  <Plus data-icon="inline-start" aria-hidden="true" /> 加入待绑定仓库列表
                </Button>
                <span className="text-xs text-muted-foreground">已加入 {draftRepos.length} 个仓库</span>
              </div>
            )}

            {draftRepos.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-input p-2.5">
                {draftRepos.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant="secondary" className="text-info">{item.role}</Badge>
                      <Badge variant="outline" className="text-muted-foreground">
                        {item.sourceType === 'remote' ? '线上只读' : '本地'}
                      </Badge>
                      <span className="truncate font-mono text-foreground-secondary">
                        {item.localPath ?? item.remoteUrl}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-destructive"
                      onClick={() => setDraftRepos((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      移除
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {errorMsg && (
              <Alert variant="destructive" className="border-destructive/40 bg-diff-removed">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        {sourceTab !== 'workset' && (
          <DialogFooter className="mx-0 mb-0 shrink-0 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting && <Spinner data-icon="inline-start" aria-hidden="true" />}
              {submitting ? '处理中...' : mode === 'create-workspace' ? '创建并切换' : '确认绑定'}
            </Button>
          </DialogFooter>
        )}

        {folderPickerTarget && (
          <LocalFolderPickerModal
            initialPath={folderPickerTarget === 'localPath' ? localPath : scanRoot}
            onSelect={(pickedPath) => {
              if (folderPickerTarget === 'localPath') {
                setLocalPath(pickedPath);
              } else {
                setScanRoot(pickedPath);
                void runScan(pickedPath, onlyOpenSpec);
              }
            }}
            onClose={() => setFolderPickerTarget(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
