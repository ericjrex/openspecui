import type { RepoBinding } from '@openspecui/shared';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { SortableDragHandle } from './SortableDragHandle';
import type { DragItemData } from './types';

export interface RepoStats {
  activeCount: number;
  planning: number;
  ready: number;
  inProgress: number;
  complete: number;
  checked: number;
  total: number;
}

interface RepoFilterCardProps {
  repo: RepoBinding;
  stats: RepoStats;
  colorClass: string;
  selected: boolean;
  readOnlyMode: boolean;
  onSelect: () => void;
}

function RepoFilterCard({ repo, stats, colorClass, selected, readOnlyMode, onSelect }: RepoFilterCardProps) {
  const data: DragItemData = { kind: 'repo', persistId: repo.id, label: repo.name };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: `repo:${repo.id}`, data, disabled: readOnlyMode });

  return (
    <Card
      ref={setNodeRef}
      size="sm"
      className={cn(
        'relative min-w-[185px] shrink-0 gap-0 p-0 transition-[opacity,box-shadow]',
        selected && 'ring-2 ring-ring/60',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-info/60',
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Button
        type="button"
        variant="ghost"
        aria-pressed={selected}
        aria-label={`筛选仓库：${repo.name}`}
        onClick={onSelect}
        className="h-auto w-full flex-col items-stretch gap-1.5 rounded-xl px-3 py-3 pr-10 text-left whitespace-normal"
      >
        <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn('size-2 shrink-0 rounded-full', colorClass)} aria-hidden="true" />
            <span className="truncate">{repo.name}</span>
          </span>
          <Badge variant="secondary" className="text-[10px]">{stats.activeCount} active</Badge>
        </span>
        <span className="text-[11px] font-normal text-muted-foreground">
          {stats.checked}/{stats.total} tasks checked
        </span>
        <span className="flex gap-1.5 text-[10px] font-normal text-muted-foreground">
          <span>P:{stats.planning}</span>
          <span>R:{stats.ready}</span>
          <span>I:{stats.inProgress}</span>
          <span>C:{stats.complete}</span>
        </span>
      </Button>
      <SortableDragHandle
        label={`拖动排序仓库：${repo.name}`}
        disabled={readOnlyMode}
        listeners={listeners}
        attributes={attributes}
        setActivatorNodeRef={setActivatorNodeRef}
        className="absolute top-2 right-2"
      />
    </Card>
  );
}

interface RepoFilterBarProps {
  repos: RepoBinding[];
  allStats: RepoStats;
  repoStats: Array<{ repo: RepoBinding } & RepoStats>;
  repoColorMap: Map<string, string>;
  selectedRepoId: string;
  readOnlyMode: boolean;
  onSelectRepo: (repoId: string) => void;
}

export function RepoFilterBar({
  repos,
  allStats,
  repoStats,
  repoColorMap,
  selectedRepoId,
  readOnlyMode,
  onSelectRepo,
}: RepoFilterBarProps) {
  if (repos.length === 0) {
    return null;
  }

  return (
    <SortableContext items={repos.map((repo) => `repo:${repo.id}`)} strategy={horizontalListSortingStrategy}>
      <div className="flex w-max gap-2.5 overflow-x-auto pb-1">
        <Card size="sm" className="min-w-[175px] shrink-0 gap-0 p-0">
          <Button
            type="button"
            variant="ghost"
            aria-pressed={selectedRepoId === 'all'}
            aria-label="筛选仓库：全部仓库"
            onClick={() => onSelectRepo('all')}
            className={cn(
              'h-auto w-full flex-col items-stretch gap-1.5 rounded-xl px-3 py-3 text-left whitespace-normal',
              selectedRepoId === 'all' && 'bg-muted',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold">
              <span>All repos</span>
              <Badge variant="secondary" className="text-[10px]">{allStats.activeCount} active</Badge>
            </span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {allStats.checked}/{allStats.total} tasks checked
            </span>
            <span className="flex gap-1.5 text-[10px] font-normal text-muted-foreground">
              <span>P:{allStats.planning}</span>
              <span>R:{allStats.ready}</span>
              <span>I:{allStats.inProgress}</span>
              <span>C:{allStats.complete}</span>
            </span>
          </Button>
        </Card>
        {repoStats.map((stats) => (
          <RepoFilterCard
            key={stats.repo.id}
            repo={stats.repo}
            stats={stats}
            colorClass={repoColorMap.get(stats.repo.id) ?? 'bg-repo-sky'}
            selected={selectedRepoId === stats.repo.id}
            readOnlyMode={readOnlyMode}
            onSelect={() => onSelectRepo(selectedRepoId === stats.repo.id ? 'all' : stats.repo.id)}
          />
        ))}
      </div>
    </SortableContext>
  );
}
