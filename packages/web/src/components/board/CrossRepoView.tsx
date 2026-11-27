import type { CrossRepoChangeGroup, Workspace } from '@openspecui/shared';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Columns3, Link2, Unlink } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { formatArchiveTime } from '../../utils/formatArchiveTime';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { SortableDragHandle } from './SortableDragHandle';
import type { DragItemData, FlatChangeEntry } from './types';

interface CrossRepoViewProps {
  workspace: Workspace;
  groups: CrossRepoChangeGroup[];
  entries: FlatChangeEntry[];
  repoColorMap: Map<string, string>;
  selectedRepoId: string;
  searchText: string;
  readOnlyMode: boolean;
  onOpenDetail: (groupKey: string, focusRepoId?: string) => void;
  onSelectRepo: (repoId: string) => void;
  onDeleteRepoLink: (linkId: string) => void;
  onDeleteChangeLink: (linkId: string) => void;
}

interface SortableGroupCardProps {
  group: CrossRepoChangeGroup;
  readOnlyMode: boolean;
  onOpenDetail: () => void;
  onDeleteChangeLink?: () => void;
}

function SortableGroupCard({
  group,
  readOnlyMode,
  onOpenDetail,
  onDeleteChangeLink,
}: SortableGroupCardProps) {
  const data: DragItemData = { kind: 'group', persistId: group.key, label: group.title };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: `group:${group.key}`, data, disabled: readOnlyMode });
  const pct = group.totalProgress.total > 0
    ? Math.round((group.totalProgress.completed / group.totalProgress.total) * 100)
    : 0;
  const statusLabel = group.aggregateStatus === 'mixed'
    ? '混合（部分归档）'
    : group.aggregateStatus === 'all_archived'
      ? '已归档'
      : group.stage;

  return (
    <Card
      ref={setNodeRef}
      className={cn('gap-3', isDragging && 'opacity-50', isOver && 'ring-2 ring-info/60')}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CardHeader className="gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Columns3 className="size-4 shrink-0 text-info" />
          <CardTitle className="truncate text-sm">{group.title}</CardTitle>
          {group.isManualLink && <Badge variant="secondary" className="text-[10px]">手动关联组</Badge>}
        </div>
        <CardDescription className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{statusLabel}</Badge>
          {!readOnlyMode && group.isManualLink && group.manualLinkId && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`解除变更关联：${group.title}`}
              title="解除跨仓 Change 关联"
              onClick={onDeleteChangeLink}
            >
              <Unlink data-icon="inline-start" />
            </Button>
          )}
        </CardDescription>
        <CardAction>
          <SortableDragHandle
            label={`拖动排序跨仓变更组：${group.title}`}
            disabled={readOnlyMode}
            listeners={listeners}
            attributes={attributes}
            setActivatorNodeRef={setActivatorNodeRef}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>联合进度：{group.totalProgress.completed} / {group.totalProgress.total}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} aria-label={`${group.title} 联合任务进度`} />
        </div>
        <Separator />
        <div className="flex flex-wrap gap-1.5">
          {group.entries.map((entry) => (
            <Badge key={`${entry.repoId}:${entry.changeName}`} variant="outline" className="h-auto whitespace-normal">
              <strong className="text-info">[{entry.repoRole}]</strong> {entry.changeName} ({entry.progress.completed}/{entry.progress.total})
              {entry.archived ? ` · 归档 ${formatArchiveTime(entry.archivedAt, entry.archivedDate)}` : ''}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onOpenDetail} aria-label={`打开跨仓变更组：${group.title}`}>
          打开变更组
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CrossRepoView({
  workspace,
  groups,
  entries,
  repoColorMap,
  selectedRepoId,
  searchText,
  readOnlyMode,
  onOpenDetail,
  onSelectRepo,
  onDeleteRepoLink,
  onDeleteChangeLink,
}: CrossRepoViewProps) {
  const repoLinks = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (workspace.repoLinks ?? []).filter((link) => {
      if (selectedRepoId !== 'all' && !link.repoIds.includes(selectedRepoId)) return false;
      if (!query) return true;
      const linkedNames = link.repoIds
        .map((id) => workspace.repos.find((repo) => repo.id === id)?.name ?? '')
        .join(' ');
      return `${link.title} ${linkedNames}`.toLowerCase().includes(query);
    });
  }, [workspace.repoLinks, workspace.repos, selectedRepoId, searchText]);

  return (
    <div className="flex flex-col gap-4">
      {repoLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold">跨仓项目关联组 ({repoLinks.length})</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {repoLinks.map((link) => {
              const linkedRepos = link.repoIds
                .map((id) => workspace.repos.find((repo) => repo.id === id))
                .filter((repo): repo is NonNullable<typeof repo> => Boolean(repo));
              const groupEntries = entries.filter((item) => link.repoIds.includes(item.entry.repoId));
              const completed = groupEntries.reduce((sum, item) => sum + item.entry.progress.completed, 0);
              const total = groupEntries.reduce((sum, item) => sum + item.entry.progress.total, 0);
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <Card key={link.id} className="gap-3">
                  <CardHeader className="gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link2 className="size-4 shrink-0 text-info" />
                      <CardTitle className="truncate text-sm">{link.title}</CardTitle>
                      <Badge variant="secondary" className="text-[10px]">项目关联组 ({linkedRepos.length} 仓)</Badge>
                    </div>
                    <CardAction>
                      {!readOnlyMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`解除跨仓项目关联：${link.title}`}
                          title="解除跨仓项目关联"
                          onClick={() => onDeleteRepoLink(link.id)}
                        >
                          <Unlink data-icon="inline-start" />
                        </Button>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {linkedRepos.map((repo) => {
                        const count = groupEntries.filter((item) => item.entry.repoId === repo.id).length;
                        return (
                          <Button
                            key={repo.id}
                            type="button"
                            variant="outline"
                            size="xs"
                            aria-label={`筛选仓库：${repo.name}`}
                            onClick={() => onSelectRepo(repo.id)}
                          >
                            <span
                              className={cn('size-2 rounded-full', repoColorMap.get(repo.id) ?? 'bg-repo-sky')}
                              aria-hidden="true"
                            />
                            <strong className="text-info">[{repo.role}]</strong>
                            {repo.name} ({count})
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>组内任务联合进度：{completed} / {total}</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} aria-label={`${link.title} 组内联合任务进度`} />
                    </div>
                    {groupEntries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {groupEntries.slice(0, 8).map(({ groupKey, entry }) => (
                          <Button
                            key={`${entry.repoId}:${entry.archiveFolderName ?? entry.changeName}`}
                            type="button"
                            variant="outline"
                            size="xs"
                            aria-label={`打开变更：${entry.changeName}（${entry.repoName}）`}
                            onClick={() => onOpenDetail(groupKey, entry.repoId)}
                          >
                            [{entry.repoRole}] {entry.changeName}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {groups.length === 0 && repoLinks.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>暂无跨仓项目关联组或同名跨仓 Change</EmptyTitle>
            <EmptyDescription>可点击右上角「关联跨仓项目」将多个协作仓库绑到一起</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <SortableContext items={groups.map((group) => `group:${group.key}`)} strategy={rectSortingStrategy}>
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => (
              <SortableGroupCard
                key={group.key}
                group={group}
                readOnlyMode={readOnlyMode}
                onOpenDetail={() => onOpenDetail(group.key)}
                onDeleteChangeLink={group.manualLinkId
                  ? () => onDeleteChangeLink(group.manualLinkId!)
                  : undefined}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
