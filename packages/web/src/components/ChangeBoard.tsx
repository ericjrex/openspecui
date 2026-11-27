/**
 * @file 兼容性多阶段 Kanban 看板、By-Repo 泳道、Cross-Repo 聚合与 Specs 浏览组件
 * @description 使用 shadcn/ui 与 @dnd-kit 保留阶段式看板、仓库筛选、归档、Specs、Ideas 和跨仓关联行为。
 * @author ypc
 */

import type {
  ChangeStage,
  CrossRepoChangeGroup,
  MainSpecEntry,
  RepoChangeEntry,
  Workspace,
  WorkspaceIdea,
} from '@openspecui/shared';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Archive,
  Kanban,
  Layers,
  Lightbulb,
  Link2,
  Plus,
  Rows3,
  Search,
} from 'lucide-react';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { api } from '../api';
import { REPO_COLOR_CLASSES, STAGE_META } from '../lib/status';
import { cn } from '../lib/utils';
import { compareArchivedEntriesDesc } from '../utils/formatArchiveTime';
import { ArchiveView } from './board/ArchiveView';
import { ChangeCard } from './board/ChangeCard';
import { CrossRepoView } from './board/CrossRepoView';
import { IdeaColumn } from './board/IdeaColumn';
import { RepoFilterBar } from './board/RepoFilterBar';
import { RepoLinkDialog } from './board/RepoLinkDialog';
import { SpecsView } from './board/SpecsView';
import {
  canDropOn,
  getChangeDragId,
  getEntrySortKey,
  reorderStringList,
  type BoardTab,
  type DragItemData,
  type DragKind,
  type LayoutMode,
  type SortMode,
} from './board/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface ChangeBoardProps {
  workspace: Workspace;
  changeGroups: CrossRepoChangeGroup[];
  mainSpecs: MainSpecEntry[];
  readOnlyMode?: boolean;
  onOpenDetail: (groupKey: string, focusRepoId?: string) => void;
  onOpenIdeaModal: (idea?: WorkspaceIdea | null) => void;
  onRefresh: () => void;
}

const STAGE_COLUMNS: ChangeStage[] = ['planning', 'ready_to_apply', 'in_progress', 'complete'];

function readDragItemData(value: unknown): DragItemData | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const candidate = value as Partial<DragItemData>;
  if (
    (candidate.kind === 'repo'
      || candidate.kind === 'idea'
      || candidate.kind === 'change'
      || candidate.kind === 'group')
    && typeof candidate.persistId === 'string'
    && typeof candidate.label === 'string'
  ) {
    return candidate as DragItemData;
  }
  return undefined;
}

export function ChangeBoard({
  workspace,
  changeGroups,
  mainSpecs,
  readOnlyMode = false,
  onOpenDetail,
  onOpenIdeaModal,
  onRefresh,
}: ChangeBoardProps) {
  const [boardTab, setBoardTab] = useState<BoardTab>('board');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('stages');
  const [selectedRepoId, setSelectedRepoId] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(
    workspace.customOrder?.changeOrder?.length ? 'custom' : 'name-asc',
  );
  const [showArchived, setShowArchived] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [selectedMainSpec, setSelectedMainSpec] = useState<MainSpecEntry | null>(mainSpecs[0] ?? null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const activeData = readDragItemData(args.active.data.current);
    const compatibleContainers = args.droppableContainers.filter((container) =>
      canDropOn(activeData, readDragItemData(container.data.current)),
    );
    return closestCenter({ ...args, droppableContainers: compatibleContainers });
  }, []);

  const accessibility = useMemo<NonNullable<ComponentProps<typeof DndContext>['accessibility']>>(() => ({
    screenReaderInstructions: {
      draggable: '按空格键开始拖动，使用方向键移动，再按空格键放下，按 Escape 键取消。',
    },
    announcements: {
      onDragStart: ({ active }) => `开始拖动${readDragItemData(active.data.current)?.label ?? active.id}`,
      onDragOver: ({ active, over }) => {
        if (!over) return undefined;
        const activeLabel = readDragItemData(active.data.current)?.label ?? active.id;
        const overLabel = readDragItemData(over.data.current)?.label ?? over.id;
        return `${activeLabel} 位于 ${overLabel} 上方`;
      },
      onDragEnd: ({ active, over }) => {
        const activeLabel = readDragItemData(active.data.current)?.label ?? active.id;
        return over ? `已将 ${activeLabel} 移动到新位置` : `已取消拖动 ${activeLabel}`;
      },
      onDragCancel: ({ active }) => `已取消拖动 ${readDragItemData(active.data.current)?.label ?? active.id}`,
    } satisfies Announcements,
  }), []);

  const repoColorMap = useMemo(() => {
    const map = new Map<string, string>();
    workspace.repos.forEach((repo, index) => {
      map.set(repo.id, REPO_COLOR_CLASSES[index % REPO_COLOR_CLASSES.length]);
    });
    return map;
  }, [workspace.repos]);

  const flatEntries = useMemo(() => {
    const list: Array<{ groupKey: string; entry: RepoChangeEntry }> = [];
    for (const group of changeGroups) {
      for (const entry of group.entries) {
        list.push({ groupKey: group.key, entry });
      }
    }
    return list;
  }, [changeGroups]);

  const repoStats = useMemo(() => {
    const computeCounts = (items: RepoChangeEntry[]) => {
      const active = items.filter((entry) => !entry.archived);
      return {
        activeCount: active.length,
        planning: active.filter((entry) => entry.stage === 'planning').length,
        ready: active.filter((entry) => entry.stage === 'ready_to_apply').length,
        inProgress: active.filter((entry) => entry.stage === 'in_progress').length,
        complete: active.filter((entry) => entry.stage === 'complete').length,
        checked: active.reduce((sum, entry) => sum + entry.progress.completed, 0),
        total: active.reduce((sum, entry) => sum + entry.progress.total, 0),
      };
    };
    const allEntries = flatEntries.map((item) => item.entry);
    return {
      all: computeCounts(allEntries),
      byRepo: workspace.repos.map((repo) => ({
        repo,
        ...computeCounts(allEntries.filter((entry) => entry.repoId === repo.id)),
      })),
    };
  }, [flatEntries, workspace.repos]);

  const filteredEntries = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const list = flatEntries.filter(({ entry }) => {
      if (selectedRepoId !== 'all' && entry.repoId !== selectedRepoId) return false;
      if (!showArchived && entry.archived) return false;
      if (query) {
        const haystack = `${entry.changeName} ${entry.repoName} ${entry.summary}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    const customRank = new Map(
      (workspace.customOrder?.changeOrder ?? []).map((key, index) => [key, index]),
    );
    const pct = (entry: RepoChangeEntry) => entry.progress.total > 0
      ? entry.progress.completed / entry.progress.total
      : 0;
    list.sort((a, b) => {
      if (sortMode === 'custom') {
        const rankA = customRank.get(getEntrySortKey(a.entry)) ?? Number.MAX_SAFE_INTEGER;
        const rankB = customRank.get(getEntrySortKey(b.entry)) ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
      }
      if (sortMode === 'name-desc') return b.entry.changeName.localeCompare(a.entry.changeName);
      if (sortMode === 'least-done') return pct(a.entry) - pct(b.entry);
      if (sortMode === 'most-done') return pct(b.entry) - pct(a.entry);
      if (a.entry.archived && b.entry.archived) {
        return compareArchivedEntriesDesc(a.entry, b.entry);
      }
      return a.entry.changeName.localeCompare(b.entry.changeName);
    });
    return list;
  }, [flatEntries, selectedRepoId, showArchived, searchText, sortMode, workspace.customOrder]);

  const filteredGroups = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const list = changeGroups.filter((group) => {
      if (!showArchived && group.aggregateStatus === 'all_archived') return false;
      if (selectedRepoId !== 'all' && !group.entries.some((entry) => entry.repoId === selectedRepoId)) {
        return false;
      }
      if (query && !`${group.title} ${group.entries.map((entry) => entry.summary).join(' ')}`.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
    const pickLatestArchivedEntry = (group: CrossRepoChangeGroup) => {
      const archived = group.entries.filter((entry) => entry.archived);
      return archived.length > 0 ? [...archived].sort(compareArchivedEntriesDesc)[0] : undefined;
    };
    const rank = new Map(
      (workspace.customOrder?.changeOrder ?? []).map((key, index) => [key, index]),
    );
    list.sort((a, b) => {
      if (sortMode === 'custom') {
        const rankA = rank.get(a.key) ?? Number.MAX_SAFE_INTEGER;
        const rankB = rank.get(b.key) ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
      }
      if (a.aggregateStatus === 'all_archived' && b.aggregateStatus === 'all_archived') {
        const entryA = pickLatestArchivedEntry(a);
        const entryB = pickLatestArchivedEntry(b);
        if (entryA && entryB) return compareArchivedEntriesDesc(entryA, entryB);
      }
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [changeGroups, showArchived, selectedRepoId, searchText, sortMode, workspace.customOrder]);

  const filteredSpecs = useMemo(() => {
    if (selectedRepoId === 'all') return mainSpecs;
    return mainSpecs.filter((spec) => spec.repoId === selectedRepoId);
  }, [mainSpecs, selectedRepoId]);

  const activeCount = useMemo(
    () => flatEntries.filter((item) => !item.entry.archived).length,
    [flatEntries],
  );
  const totalArchivedCount = useMemo(
    () => flatEntries.filter((item) => item.entry.archived).length,
    [flatEntries],
  );
  const filteredArchivedEntries = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return flatEntries
      .filter(({ entry }) => {
        if (!entry.archived) return false;
        if (selectedRepoId !== 'all' && entry.repoId !== selectedRepoId) return false;
        if (
          query
          && !`${entry.changeName} ${entry.archiveFolderName ?? ''} ${entry.summary} ${entry.repoName}`
            .toLowerCase()
            .includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => compareArchivedEntriesDesc(a.entry, b.entry));
  }, [flatEntries, selectedRepoId, searchText]);

  const activeCountByRepo = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { entry } of flatEntries) {
      if (!entry.archived) {
        counts.set(entry.repoId, (counts.get(entry.repoId) ?? 0) + 1);
      }
    }
    return counts;
  }, [flatEntries]);

  const toggleLinkRepo = (repoId: string) => {
    setSelectedRepoIds((previous) =>
      previous.includes(repoId) ? previous.filter((id) => id !== repoId) : [...previous, repoId],
    );
  };

  const handleCreateRepoLink = async () => {
    setLinkError(null);
    if (!linkTitle.trim() || selectedRepoIds.length < 2) {
      setLinkError('请填写跨仓项目组名称并至少勾选 2 个项目仓库');
      return;
    }
    try {
      await api.createRepoLink(workspace.id, {
        title: linkTitle.trim(),
        repoIds: selectedRepoIds,
      });
      setShowLinkModal(false);
      setLinkTitle('');
      setSelectedRepoIds([]);
      onRefresh();
    } catch (error) {
      setLinkError((error as Error).message);
    }
  };

  const handleDropReorder = async (
    kind: DragKind,
    sourceId: string,
    targetId: string,
    sourceStage?: ChangeStage,
    targetStage?: ChangeStage,
  ) => {
    if (readOnlyMode || sourceId === targetId) return;
    if (kind === 'change' && sourceStage !== targetStage) return;

    if (kind === 'repo') {
      const nextRepoIds = reorderStringList(workspace.repos.map((repo) => repo.id), sourceId, targetId);
      await api.updateWorkspaceOrder(workspace.id, { repoIds: nextRepoIds });
    } else if (kind === 'idea') {
      const nextIdeaOrder = reorderStringList(workspace.ideas.map((idea) => idea.id), sourceId, targetId);
      await api.updateWorkspaceOrder(workspace.id, { ideaOrder: nextIdeaOrder });
    } else if (kind === 'change') {
      const baseKeys = Array.from(new Set([
        ...(workspace.customOrder?.changeOrder ?? []),
        ...filteredEntries.map(({ entry }) => getEntrySortKey(entry)),
      ]));
      const nextChangeOrder = reorderStringList(baseKeys, sourceId, targetId);
      setSortMode('custom');
      await api.updateWorkspaceOrder(workspace.id, { changeOrder: nextChangeOrder });
    } else {
      const baseKeys = Array.from(new Set([
        ...(workspace.customOrder?.changeOrder ?? []),
        ...filteredGroups.map((group) => group.key),
      ]));
      const nextChangeOrder = reorderStringList(baseKeys, sourceId, targetId);
      setSortMode('custom');
      await api.updateWorkspaceOrder(workspace.id, { changeOrder: nextChangeOrder });
    }
    onRefresh();
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeData = readDragItemData(active.data.current);
    const overData = readDragItemData(over?.data.current);
    if (!over || !activeData || !overData || !canDropOn(activeData, overData)) return;
    void handleDropReorder(
      activeData.kind,
      activeData.persistId,
      overData.persistId,
      activeData.stage,
      overData.stage,
    );
  };

  const visibleColumns: ChangeStage[] = showArchived
    ? [...STAGE_COLUMNS, 'archived']
    : STAGE_COLUMNS;

  return (
    <DndContext
      sensors={readOnlyMode ? [] : sensors}
      collisionDetection={collisionDetection}
      accessibility={accessibility}
      onDragEnd={handleDragEnd}
    >
      <Tabs value={boardTab} onValueChange={(value) => setBoardTab(value as BoardTab)} className="w-full min-w-0 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList aria-label="看板内容">
            <TabsTrigger value="board">Board 看板 ({activeCount})</TabsTrigger>
            <TabsTrigger value="archive">
              <Archive data-icon="inline-start" /> Archive 归档库 ({totalArchivedCount})
            </TabsTrigger>
            <TabsTrigger value="specs">Specs 规范库 ({mainSpecs.length})</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {boardTab === 'board' && (
              <>
                <Button
                  type="button"
                  variant={showArchived ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={showArchived}
                  onClick={() => setShowArchived((value) => !value)}
                >
                  <Archive data-icon="inline-start" /> Archived ({totalArchivedCount})
                </Button>
                {!readOnlyMode && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenIdeaModal(null)}>
                    <Lightbulb data-icon="inline-start" /> New idea
                  </Button>
                )}
                {!readOnlyMode && workspace.repos.length >= 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLinkError(null);
                      setShowLinkModal(true);
                    }}
                  >
                    <Link2 data-icon="inline-start" /> 关联跨仓项目
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <RepoFilterBar
          repos={workspace.repos}
          allStats={repoStats.all}
          repoStats={repoStats.byRepo}
          repoColorMap={repoColorMap}
          selectedRepoId={selectedRepoId}
          readOnlyMode={readOnlyMode}
          onSelectRepo={setSelectedRepoId}
        />

        <TabsContent value="board" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <InputGroup className="w-full sm:w-56">
                <InputGroupInput
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search changes..."
                  aria-label="搜索变更"
                />
                <InputGroupAddon align="inline-start"><Search /></InputGroupAddon>
              </InputGroup>
              <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                <SelectTrigger size="sm" className="w-52" aria-label="变更排序方式">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="custom">Custom (自定义排序)</SelectItem>
                    <SelectItem value="name-asc">Name A–Z</SelectItem>
                    <SelectItem value="name-desc">Name Z–A</SelectItem>
                    <SelectItem value="least-done">Least done</SelectItem>
                    <SelectItem value="most-done">Most done</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <ToggleGroup
              type="single"
              value={layoutMode}
              onValueChange={(value) => {
                if (value) setLayoutMode(value as LayoutMode);
              }}
              variant="outline"
              size="sm"
              aria-label="看板布局"
            >
              <ToggleGroupItem value="stages"><Kanban data-icon="inline-start" /> Stages</ToggleGroupItem>
              <ToggleGroupItem value="by-repo"><Rows3 data-icon="inline-start" /> By repo</ToggleGroupItem>
              <ToggleGroupItem value="cross-repo"><Layers data-icon="inline-start" /> 跨仓聚合</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {layoutMode === 'stages' && (
            <ScrollArea className="w-full">
              <div className="flex w-max gap-3 pb-2">
                <IdeaColumn
                  ideas={workspace.ideas}
                  repos={workspace.repos}
                  expanded={showIdeas}
                  readOnlyMode={readOnlyMode}
                  onExpandedChange={setShowIdeas}
                  onOpenIdeaModal={onOpenIdeaModal}
                />
                {visibleColumns.map((stage) => {
                  const items = filteredEntries.filter(({ entry }) => entry.stage === stage);
                  const meta = STAGE_META[stage];
                  return (
                    <Card
                      key={stage}
                      role="region"
                      aria-label={`${meta.label} 阶段`}
                      className="min-w-[270px] flex-1 gap-3 bg-muted/30 p-3"
                    >
                      <CardHeader className="border-b pb-2">
                        <CardTitle className={cn('flex items-center justify-between text-xs', meta.className)}>
                          <span>{stage === 'archived' ? 'Archived' : meta.label}</span>
                          <Badge variant="secondary" className="text-[11px]">{items.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <SortableContext
                          items={items.map(({ groupKey, entry }) => getChangeDragId(groupKey, entry))}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="flex flex-col gap-2.5">
                            {items.length === 0 ? (
                              <Empty className="border">
                                <EmptyHeader>
                                  <EmptyTitle>暂无变更</EmptyTitle>
                                </EmptyHeader>
                              </Empty>
                            ) : (
                              items.map(({ groupKey, entry }) => (
                                <ChangeCard
                                  key={getChangeDragId(groupKey, entry)}
                                  groupKey={groupKey}
                                  entry={entry}
                                  repoColorClass={repoColorMap.get(entry.repoId) ?? 'bg-repo-sky'}
                                  readOnlyMode={readOnlyMode}
                                  onOpenDetail={onOpenDetail}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {layoutMode === 'by-repo' && (
            <div className="flex flex-col gap-4">
              {workspace.repos
                .filter((repo) => selectedRepoId === 'all' || repo.id === selectedRepoId)
                .map((repo) => {
                  const repoItems = filteredEntries.filter(({ entry }) => entry.repoId === repo.id);
                  return (
                    <Card key={repo.id} className="gap-3 p-4">
                      <CardHeader className="border-b pb-2">
                        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn('size-2.5 rounded-full', repoColorMap.get(repo.id) ?? 'bg-repo-sky')}
                              aria-hidden="true"
                            />
                            {repo.name}
                            <Badge variant="secondary" className="text-[10px]">{repo.role}</Badge>
                          </span>
                          <span className="font-normal text-muted-foreground">{repoItems.length} 项变更</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        {repoItems.length === 0 ? (
                          <Empty className="border-0 p-4">
                            <EmptyHeader><EmptyTitle>该仓库暂无匹配 Change</EmptyTitle></EmptyHeader>
                          </Empty>
                        ) : (
                          <SortableContext
                            items={repoItems.map(({ groupKey, entry }) => getChangeDragId(groupKey, entry))}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                              {repoItems.map(({ groupKey, entry }) => (
                                <ChangeCard
                                  key={getChangeDragId(groupKey, entry)}
                                  groupKey={groupKey}
                                  entry={entry}
                                  repoColorClass={repoColorMap.get(entry.repoId) ?? 'bg-repo-sky'}
                                  readOnlyMode={readOnlyMode}
                                  onOpenDetail={onOpenDetail}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}

          {layoutMode === 'cross-repo' && (
            <CrossRepoView
              workspace={workspace}
              groups={filteredGroups}
              entries={filteredEntries}
              repoColorMap={repoColorMap}
              selectedRepoId={selectedRepoId}
              searchText={searchText}
              readOnlyMode={readOnlyMode}
              onOpenDetail={onOpenDetail}
              onSelectRepo={setSelectedRepoId}
              onDeleteRepoLink={(linkId) => {
                void api.deleteRepoLink(workspace.id, linkId).then(onRefresh);
              }}
              onDeleteChangeLink={(linkId) => {
                void api.deleteChangeLink(workspace.id, linkId).then(onRefresh);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="archive">
          <ArchiveView
            entries={filteredArchivedEntries}
            repoColorMap={repoColorMap}
            searchText={searchText}
            onSearchChange={setSearchText}
            onOpenDetail={onOpenDetail}
          />
        </TabsContent>

        <TabsContent value="specs">
          <SpecsView
            specs={filteredSpecs}
            selectedSpec={selectedMainSpec}
            onSelectSpec={setSelectedMainSpec}
          />
        </TabsContent>
      </Tabs>

      <RepoLinkDialog
        open={showLinkModal}
        repos={workspace.repos}
        title={linkTitle}
        selectedRepoIds={selectedRepoIds}
        error={linkError}
        repoColorMap={repoColorMap}
        activeCountByRepo={activeCountByRepo}
        onOpenChange={setShowLinkModal}
        onTitleChange={setLinkTitle}
        onToggleRepo={toggleLinkRepo}
        onCreate={() => void handleCreateRepoLink()}
      />
    </DndContext>
  );
}
