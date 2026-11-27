/**
 * @file Change 详情工作台弹窗/面板组件
 * @description 展示 Proposal、Specs（含 Delta vs Main Diff）、Design、Tasks（含依赖状态与回写）及 Git 关联 Diff。
 */

import type {
  CrossRepoChangeGroup,
  CrossRepoProjectLink,
  GitDiffResult,
  RepoChangeEntry,
} from '@openspecui/shared';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Check,
  Columns2,
  GitBranch,
  GitCommitHorizontal,
  Lock,
  Maximize2,
  Minimize2,
  Pin,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type RepoChangeGitMatchResponse } from '../api';
import { DELTA_STATUS_META } from '../lib/status';
import { formatArchiveTime } from '../utils/formatArchiveTime';
import { InlineAlert } from './common/InlineAlert';
import { StatusBadge } from './common/StatusBadge';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { DiffViewer } from './DiffViewer';
import { headingTextToSlug, MarkdownViewer } from './MarkdownViewer';

type DetailTabId = 'proposal' | 'specs' | 'design' | 'tasks' | 'git';

interface ResolvedArtifactLink {
  tab: 'proposal' | 'specs' | 'design' | 'tasks';
  anchor?: string;
  capabilityPath?: string;
}

/**
 * 解析 Markdown 文档中的相对路径超链接，判断是否指向当前 Change 的四大产物 Tab
 */
function resolveChangeArtifactLink(href: string): ResolvedArtifactLink | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return null;
  }

  const hashIdx = trimmed.indexOf('#');
  const rawPath = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
  const rawHash = hashIdx >= 0 ? trimmed.slice(hashIdx + 1) : '';
  const cleanPath = rawPath.split('?')[0].replace(/\\/g, '/').trim();
  let decodedPath = cleanPath;
  let anchor = rawHash.trim();
  try {
    decodedPath = decodeURIComponent(cleanPath);
    anchor = decodeURIComponent(anchor);
  } catch {
    // 保留原值避免非法百分号编码抛错
  }

  const normalized = decodedPath
    .replace(/^(\.\/)+/, '')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\/+/, '')
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  const segments = normalized.split('/').filter(Boolean);
  const fileName = segments[segments.length - 1] ?? '';

  if (fileName === 'proposal.md' || normalized === 'proposal') {
    return { tab: 'proposal', anchor: anchor || undefined };
  }
  if (fileName === 'design.md' || normalized === 'design') {
    return { tab: 'design', anchor: anchor || undefined };
  }
  if (fileName === 'tasks.md' || normalized === 'tasks') {
    return { tab: 'tasks', anchor: anchor || undefined };
  }

  // 匹配 specs/、specs/<cap>/spec.md 或直接指向某能力 spec.md
  const specsIdx = segments.lastIndexOf('specs');
  if (specsIdx >= 0) {
    const afterSpecs = segments.slice(specsIdx + 1);
    const capParts = afterSpecs[afterSpecs.length - 1] === 'spec.md' ? afterSpecs.slice(0, -1) : afterSpecs;
    return {
      tab: 'specs',
      capabilityPath: capParts.length > 0 ? capParts.join('/') : undefined,
      anchor: anchor || undefined,
    };
  }
  if (fileName === 'spec.md') {
    return { tab: 'specs', anchor: anchor || undefined };
  }

  return null;
}

interface ChangeDetailViewProps {
  workspaceId: string;
  group: CrossRepoChangeGroup;
  repoLinks?: CrossRepoProjectLink[];
  initialRepoId?: string;
  readOnlyMode?: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const BRANCH_AUTO_SENTINEL = '__auto__';

export function ChangeDetailView({
  workspaceId,
  group,
  repoLinks = [],
  initialRepoId,
  readOnlyMode = false,
  onClose,
  onRefresh,
}: ChangeDetailViewProps) {
  const [activeRepoId, setActiveRepoId] = useState<string>(
    initialRepoId ?? group.entries[0]?.repoId ?? '',
  );
  const [activeTab, setActiveTab] = useState<DetailTabId>('proposal');
  const [compareSideBySide, setCompareSideBySide] = useState(false);
  const [specsViewMode, setSpecsViewMode] = useState<'markdown' | 'diff'>('markdown');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [pendingScrollTarget, setPendingScrollTarget] = useState<{
    anchor?: string;
    capabilityPath?: string;
    scrollTopOnTabSwitch?: boolean;
  } | null>(null);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  const [gitMatches, setGitMatches] = useState<RepoChangeGitMatchResponse[]>([]);
  const [showUnrelatedRepos, setShowUnrelatedRepos] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<GitDiffResult | null>(null);
  const [diffTitle, setDiffTitle] = useState('');
  const [loadingDiff, setLoadingDiff] = useState(false);

  const [taskNotice, setTaskNotice] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialRepoId && group.entries.some((e) => e.repoId === initialRepoId)) {
      setActiveRepoId(initialRepoId);
    } else if (!group.entries.some((e) => e.repoId === activeRepoId)) {
      setActiveRepoId(group.entries[0]?.repoId ?? '');
    }
  }, [group, initialRepoId, activeRepoId]);

  const resolvedOwnerRepoIds = (() => {
    const directIds = group.entries.map((e) => e.repoId);
    const linkedIds = new Set<string>(directIds);
    for (const link of repoLinks) {
      if (link.repoIds.some((id) => directIds.includes(id))) {
        for (const id of link.repoIds) {
          linkedIds.add(id);
        }
      }
    }
    return Array.from(linkedIds);
  })();

  useEffect(() => {
    const names = Array.from(new Set([group.title, ...group.entries.map((e) => e.changeName)]));
    void api
      .matchChangeGit(workspaceId, group.key, names, resolvedOwnerRepoIds)
      .then((res) => setGitMatches(res.matches))
      .catch(() => setGitMatches([]));
    setShowUnrelatedRepos(false);
    setSelectedDiff(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, group.key, group.title, group.entries, repoLinks]);

  const currentEntry: RepoChangeEntry | undefined =
    group.entries.find((e) => e.repoId === activeRepoId) ?? group.entries[0];

  useEffect(() => {
    if (!pendingScrollTarget) return;
    const rafId = window.requestAnimationFrame(() => {
      const container = contentScrollRef.current;
      if (!container) return;

      let scopeRoot: HTMLElement = container;
      let matchedCapability = false;
      if (pendingScrollTarget.capabilityPath) {
        const targetCap = pendingScrollTarget.capabilityPath.toLowerCase();
        const specBlocks = container.querySelectorAll<HTMLElement>('[data-spec-path]');
        for (const block of specBlocks) {
          const cap = (block.dataset.specPath ?? '').toLowerCase();
          if (cap === targetCap || cap.endsWith(`/${targetCap}`)) {
            scopeRoot = block;
            matchedCapability = true;
            break;
          }
        }
      }

      if (pendingScrollTarget.anchor) {
        const rawAnchor = pendingScrollTarget.anchor;
        const slugAnchor = headingTextToSlug(rawAnchor);
        const nodes = scopeRoot.querySelectorAll<HTMLElement>('[id]');
        for (const node of nodes) {
          if (node.id === rawAnchor || node.id === slugAnchor) {
            node.setAttribute('tabindex', '-1');
            node.focus({ preventScroll: true });
            node.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setPendingScrollTarget(null);
            return;
          }
        }
      }

      if (matchedCapability) {
        scopeRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (pendingScrollTarget.scrollTopOnTabSwitch) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setPendingScrollTarget(null);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [activeTab, activeRepoId, specsViewMode, pendingScrollTarget]);

  const handleNavigateMarkdownLink = (href: string): boolean => {
    const resolved = resolveChangeArtifactLink(href);
    if (!resolved) {
      setLinkNotice(`该链接指向普通相对路径（${href}），非当前 Change 的 Proposal/Specs/Design/Tasks 文档。`);
      return false;
    }

    setLinkNotice(null);
    if (resolved.tab === 'specs' && resolved.anchor && specsViewMode !== 'markdown') {
      setSpecsViewMode('markdown');
    }
    setPendingScrollTarget({
      anchor: resolved.anchor,
      capabilityPath: resolved.capabilityPath,
      scrollTopOnTabSwitch: resolved.tab !== activeTab,
    });
    setActiveTab(resolved.tab);
    return true;
  };

  const handleToggleTask = async (
    entry: RepoChangeEntry,
    lineNumber: number,
    expectedChecked: boolean,
    rawLine: string,
  ) => {
    if (readOnlyMode || !entry.tasks || entry.tasks.readOnly) {
      return;
    }
    const key = `${entry.repoId}:${lineNumber}`;
    setTogglingKey(key);
    setTaskNotice(null);
    try {
      await api.toggleTask(workspaceId, {
        repoId: entry.repoId,
        changeName: entry.changeName,
        archived: entry.archived,
        fileHash: entry.tasks.fileHash,
        lineNumber,
        expectedChecked,
        nextChecked: !expectedChecked,
        expectedRawLine: rawLine,
      });
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setTaskNotice('检测到 tasks.md 已被外部工具或 AI 修改，已自动刷新最新内容，请核对后重试。');
        onRefresh();
      } else {
        setTaskNotice((err as Error).message);
      }
    } finally {
      setTogglingKey(null);
    }
  };

  const handlePinBranch = async (repoId: string, branch: string) => {
    if (readOnlyMode) return;
    await api.setBranchPin(workspaceId, {
      changeKey: group.key,
      repoId,
      branch: branch === BRANCH_AUTO_SENTINEL ? undefined : branch || undefined,
    });
    const names = Array.from(new Set([group.title, ...group.entries.map((e) => e.changeName)]));
    const res = await api.matchChangeGit(workspaceId, group.key, names, resolvedOwnerRepoIds);
    setGitMatches(res.matches);
  };

  const handleOpenDiff = async (repoId: string, target: string, label: string) => {
    setLoadingDiff(true);
    setDiffTitle(label);
    try {
      const diff = await api.getRepoDiff(repoId, target);
      setSelectedDiff(diff);
    } finally {
      setLoadingDiff(false);
    }
  };

  const renderMissingArtifactNotice = (
    entry: RepoChangeEntry,
    id: 'proposal' | 'specs' | 'design' | 'tasks',
  ) => {
    const state = entry.artifactStates.find((a) => a.id === id);
    if (!state || state.status === 'done') return null;
    if (state.status === 'next') {
      return (
        <InlineAlert variant="info">
          尚未撰写 `{id}`，且当前无前置阻塞：这是下一步待撰写的产物（可执行 `/opsx-propose` 或 `/opsx-continue` 补全）。
        </InlineAlert>
      );
    }
    return (
      <InlineAlert>
        尚未撰写 `{id}`，当前等待前置产物完成：{state.blockedBy?.join(', ') || 'prerequisite'}。
      </InlineAlert>
    );
  };

  const renderEntrySpecs = (entry: RepoChangeEntry) => (
    <div className="space-y-4">
      {entry.deltaDiffs.length === 0 ? (
        renderMissingArtifactNotice(entry, 'specs')
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">共 {entry.deltaDiffs.length} 个能力规范文件</span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={specsViewMode}
              onValueChange={(value) => value && setSpecsViewMode(value as 'markdown' | 'diff')}
              aria-label="Specs 视图模式"
            >
              <ToggleGroupItem value="markdown">规范文档 (Markdown)</ToggleGroupItem>
              <ToggleGroupItem value="diff">Delta vs Main 对比</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {entry.deltaDiffs.map((delta) =>
            specsViewMode === 'markdown' ? (
              <div key={delta.deltaFilePath} data-spec-path={delta.capabilityPath.toLowerCase()}>
                <MarkdownViewer
                  content={delta.deltaSpecRaw}
                  title={`[${entry.repoRole}] ${delta.capabilityPath} (${delta.deltaFilePath})`}
                  onNavigateLink={handleNavigateMarkdownLink}
                />
              </div>
            ) : (
              <Card key={delta.deltaFilePath} data-spec-path={delta.capabilityPath.toLowerCase()}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-info">
                      {entry.repoRole}
                    </Badge>
                    <span className="font-mono text-xs font-semibold">{delta.capabilityPath}</span>
                  </div>
                  {delta.hasMainSpec ? (
                    <Badge variant="secondary" className="text-info">
                      已关联主规范对照
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-success">
                      全新能力规范（主 specs 尚不存在）
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {delta.items.length === 0 ? (
                    <MarkdownViewer
                      content={delta.deltaSpecRaw}
                      title={delta.deltaFilePath}
                      onNavigateLink={handleNavigateMarkdownLink}
                    />
                  ) : (
                    <div className="space-y-3">
                      {delta.items.map((item, idx) => (
                        <div key={idx} className="overflow-hidden rounded-lg border border-border bg-card">
                          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs">
                            <span className="font-semibold">
                              {item.fromName ? `${item.fromName} -> ${item.name}` : item.name}
                            </span>
                            <StatusBadge meta={DELTA_STATUS_META[item.operation]}>{item.operation}</StatusBadge>
                          </div>
                          {item.operation === 'MODIFIED' && item.beforeMarkdown ? (
                            <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                              <div className="bg-diff-removed p-3">
                                <div className="mb-1 text-10 font-medium text-destructive">主规范原条文 (Main Spec)</div>
                                <pre className="whitespace-pre-wrap text-xs leading-5 text-foreground-muted">
                                  {item.beforeMarkdown}
                                </pre>
                              </div>
                              <div className="bg-diff-added p-3">
                                <div className="mb-1 text-10 font-medium text-success">本次 Delta 变更后</div>
                                <pre className="whitespace-pre-wrap text-xs leading-5 text-foreground-secondary">
                                  {item.afterMarkdown}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap p-3 text-xs leading-5 text-foreground-secondary">
                              {item.afterMarkdown}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          )}
        </>
      )}
    </div>
  );

  const renderEntryTasks = (entry: RepoChangeEntry) => {
    if (!entry.tasks) {
      return <div className="space-y-3">{renderMissingArtifactNotice(entry, 'tasks')}</div>;
    }

    const tasks = entry.tasks;
    const isReadOnly = readOnlyMode || tasks.readOnly;
    const togglingPrefix = `${entry.repoId}:`;
    const togglingLineNumber =
      togglingKey && togglingKey.startsWith(togglingPrefix)
        ? Number(togglingKey.slice(togglingPrefix.length))
        : null;

    return (
      <div className="space-y-3">
        <MarkdownViewer
          content={tasks.rawContent}
          title={`[${entry.repoRole}] ${tasks.relativePath}`}
          onNavigateLink={handleNavigateMarkdownLink}
          headerExtra={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                ({tasks.completedCount}/{tasks.totalCount})
              </span>
              {readOnlyMode ? (
                <Badge variant="secondary" className="text-warning">
                  <Lock aria-hidden="true" className="size-3" /> 局域网只读模式
                </Badge>
              ) : entry.sourceType === 'remote' ? (
                <Badge variant="secondary" className="text-warning">
                  <Lock aria-hidden="true" className="size-3" /> 远程仓库为只读缓存（禁用勾选回写）
                </Badge>
              ) : entry.archived ? (
                <Badge variant="secondary">
                  <Lock aria-hidden="true" className="size-3" /> 已归档只读
                </Badge>
              ) : null}
            </div>
          }
          taskToggle={{
            items: tasks.items,
            disabled: isReadOnly,
            togglingLineNumber,
            onToggle: (item) =>
              void handleToggleTask(entry, item.lineNumber, item.checked, item.rawLine),
          }}
        />
      </div>
    );
  };

  const renderArtifactTabIcon = (id: 'proposal' | 'specs' | 'design' | 'tasks') => {
    const status = currentEntry?.artifactStates.find((a) => a.id === id);
    if (!status) return null;
    if (status.status === 'done') return <Check aria-hidden="true" className="size-3 text-success" />;
    if (status.status === 'next') return <ArrowRight aria-hidden="true" className="size-3 text-info" />;
    return <Lock aria-hidden="true" className="size-3 text-muted-foreground" />;
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={`flex flex-col overflow-hidden border-border-strong bg-card p-0 shadow-2xl ${
          isFullscreen
            ? 'h-screen w-screen max-w-none rounded-none border-0 sm:max-w-none'
            : 'h-[92vh] w-[96vw] max-w-[1600px] rounded-2xl sm:max-w-[1600px]'
        }`}
      >
        <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <DialogTitle className="mt-0.5 truncate text-lg font-semibold">{group.title}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
              {currentEntry && <span>{currentEntry.repoName}</span>}
              <span aria-hidden="true">·</span>
              <span>{group.stage}</span>
              <span aria-hidden="true">·</span>
              <span>
                {group.totalProgress.completed} / {group.totalProgress.total} tasks
              </span>
              {currentEntry?.archived && (
                <Badge variant="secondary" className="text-success">
                  <Archive aria-hidden="true" className="size-3" />
                  归档于 {formatArchiveTime(currentEntry.archivedAt, currentEntry.archivedDate)}
                </Badge>
              )}
            </DialogDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {group.entries.length >= 2 && (activeTab === 'specs' || activeTab === 'tasks') && (
              <Button
                variant={compareSideBySide ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={compareSideBySide}
                onClick={() => setCompareSideBySide((v) => !v)}
              >
                <Columns2 data-icon="inline-start" aria-hidden="true" /> 双仓并排对照
              </Button>
            )}

            {!compareSideBySide &&
              group.entries.length > 1 &&
              group.entries.map((entry) => (
                <Button
                  key={`${entry.repoId}:${entry.changeName}`}
                  size="sm"
                  variant={currentEntry?.repoId === entry.repoId ? 'default' : 'secondary'}
                  onClick={() => setActiveRepoId(entry.repoId)}
                >
                  [{entry.repoRole}] {entry.repoName}
                </Button>
              ))}

            <Button
              variant="outline"
              size="icon-sm"
              aria-label={isFullscreen ? '退出全屏' : '全屏查看'}
              onClick={() => setIsFullscreen((v) => !v)}
            >
              {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="关闭" onClick={onClose}>
              <X aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DetailTabId)}>
          <TabsList variant="line" className="px-5">
            <TabsTrigger value="proposal">
              {renderArtifactTabIcon('proposal')}
              Proposal
            </TabsTrigger>
            <TabsTrigger value="specs">
              {renderArtifactTabIcon('specs')}
              Specs (Delta Diff)
            </TabsTrigger>
            <TabsTrigger value="design">
              {renderArtifactTabIcon('design')}
              Design
            </TabsTrigger>
            <TabsTrigger value="tasks">
              {renderArtifactTabIcon('tasks')}
              Tasks
            </TabsTrigger>
            <TabsTrigger value="git">Git 分支 & Diff</TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator />

        <ScrollArea className="flex-1">
          <div ref={contentScrollRef} className="space-y-4 overflow-y-auto p-5">
            {linkNotice && (
              <InlineAlert
                variant="info"
                title="文档内链接提示"
                className="items-center justify-between"
              >
                <span className="min-w-0 flex-1">{linkNotice}</span>
                <Button variant="ghost" size="icon-sm" aria-label="关闭提示" onClick={() => setLinkNotice(null)}>
                  <X aria-hidden="true" />
                </Button>
              </InlineAlert>
            )}

            {taskNotice && (
              <InlineAlert variant="warning" className="items-center">
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                <span>{taskNotice}</span>
                <Button variant="outline" size="sm" className="ml-auto" onClick={onRefresh}>
                  <RefreshCw data-icon="inline-start" aria-hidden="true" /> 刷新
                </Button>
              </InlineAlert>
            )}

            {activeTab === 'specs' &&
              (compareSideBySide && group.entries.length >= 2 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.entries.map((entry) => (
                    <div key={`${entry.repoId}:${entry.changeName}`}>{renderEntrySpecs(entry)}</div>
                  ))}
                </div>
              ) : (
                currentEntry && renderEntrySpecs(currentEntry)
              ))}

            {activeTab === 'tasks' &&
              (compareSideBySide && group.entries.length >= 2 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.entries.map((entry) => (
                    <div key={`${entry.repoId}:${entry.changeName}`}>{renderEntryTasks(entry)}</div>
                  ))}
                </div>
              ) : (
                currentEntry && renderEntryTasks(currentEntry)
              ))}

            {activeTab === 'proposal' &&
              currentEntry &&
              (currentEntry.proposalContent ? (
                <MarkdownViewer
                  content={currentEntry.proposalContent}
                  title="proposal.md"
                  onNavigateLink={handleNavigateMarkdownLink}
                />
              ) : (
                renderMissingArtifactNotice(currentEntry, 'proposal')
              ))}

            {activeTab === 'design' &&
              currentEntry &&
              (currentEntry.designContent ? (
                <MarkdownViewer
                  content={currentEntry.designContent}
                  title="design.md"
                  onNavigateLink={handleNavigateMarkdownLink}
                />
              ) : (
                renderMissingArtifactNotice(currentEntry, 'design')
              ))}

            {activeTab === 'git' &&
              (() => {
                const relatedMatches = gitMatches.filter((m) => m.isRelated);
                const unrelatedMatches = gitMatches.filter((m) => !m.isRelated);
                const visibleMatches = showUnrelatedRepos ? gitMatches : relatedMatches;

                return (
                  <div className="grid gap-4 lg:grid-cols-5">
                    <div className="space-y-3 lg:col-span-2">
                      {visibleMatches.length === 0 ? (
                        <InlineAlert>当前 Change 所属仓库未命中 Git 关联记录</InlineAlert>
                      ) : (
                        visibleMatches.map((match) => (
                          <Card key={match.repoId}>
                            <CardContent className="space-y-2 p-3 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="secondary" className="text-info">
                                    {match.status.repoRole}
                                  </Badge>
                                  <span className="font-semibold">{match.status.repoName}</span>
                                  {!match.isRelated && <Badge variant="secondary">其他仓</Badge>}
                                </div>
                                <span className="text-11 text-muted-foreground">匹配：{match.matchReason}</span>
                              </div>

                              {!match.status.isGitRepo ? (
                                <div className="text-muted-foreground">{match.status.error || '非 Git 仓库'}</div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <GitBranch aria-hidden="true" className="size-3.5 text-info" />
                                    <Select
                                      value={match.matchedBranch ?? BRANCH_AUTO_SENTINEL}
                                      onValueChange={(value) => void handlePinBranch(match.repoId, value)}
                                      disabled={readOnlyMode}
                                    >
                                      <SelectTrigger className="flex-1" aria-label="固定关联分支">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={BRANCH_AUTO_SENTINEL}>自动匹配</SelectItem>
                                        {match.status.branches.map((branch) => (
                                          <SelectItem key={branch} value={branch}>
                                            {branch}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {match.isPinned && (
                                      <span className="flex items-center gap-0.5 text-10 text-warning">
                                        <Pin aria-hidden="true" className="size-3" /> 已固定
                                      </span>
                                    )}
                                  </div>

                                  {match.status.dirtyCount > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-between border-warning/30 bg-diff-modified text-warning hover:bg-diff-modified hover:text-warning"
                                      onClick={() =>
                                        void handleOpenDiff(
                                          match.repoId,
                                          'working-tree',
                                          `[${match.status.repoRole}] 未提交工作区 (${match.status.dirtyCount})`,
                                        )
                                      }
                                    >
                                      <span>查看未提交工作区改动</span>
                                      <span>{match.status.dirtyCount} 文件</span>
                                    </Button>
                                  )}

                                  <ScrollArea className="max-h-48">
                                    <div className="space-y-1">
                                      {match.commits.map((commit) => (
                                        <Button
                                          key={commit.sha}
                                          variant="ghost"
                                          className="h-auto w-full items-start justify-start gap-2 px-2 py-1.5 text-left"
                                          onClick={() =>
                                            void handleOpenDiff(
                                              match.repoId,
                                              commit.sha,
                                              `[${match.status.repoRole}] ${commit.shortSha} ${commit.subject}`,
                                            )
                                          }
                                        >
                                          <GitCommitHorizontal aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-info" />
                                          <span className="min-w-0 flex-1">
                                            <span className="block truncate">{commit.subject}</span>
                                            <span className="block text-10 text-muted-foreground">
                                              {commit.shortSha} · {commit.author} · {commit.filesChanged} 文件
                                            </span>
                                          </span>
                                        </Button>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}

                      {unrelatedMatches.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed"
                          aria-expanded={showUnrelatedRepos}
                          onClick={() => setShowUnrelatedRepos((v) => !v)}
                        >
                          {showUnrelatedRepos
                            ? `收起工作区其余未关联仓库 (${unrelatedMatches.length})`
                            : `显示工作区其余未关联仓库 (${unrelatedMatches.length}，仅用于手动关联)`}
                        </Button>
                      )}
                    </div>

                    <div className="lg:col-span-3">
                      <DiffViewer diff={selectedDiff} loading={loadingDiff} title={diffTitle} />
                    </div>
                  </div>
                );
              })()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
