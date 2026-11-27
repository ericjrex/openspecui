import type { RepoChangeEntry } from '@openspecui/shared';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRight, Archive, Check, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatArchiveTime } from '../../utils/formatArchiveTime';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { SortableDragHandle } from './SortableDragHandle';
import { getChangeDragId, getEntrySortKey, type DragItemData } from './types';

interface ChangeCardProps {
  groupKey: string;
  entry: RepoChangeEntry;
  repoColorClass: string;
  readOnlyMode: boolean;
  onOpenDetail: (groupKey: string, focusRepoId?: string) => void;
}

const ARTIFACT_BADGE_CLASSES = {
  done: 'border-success/30 bg-success/10 text-success',
  next: 'border-info/30 bg-info/10 text-info',
  blocked: 'bg-muted text-muted-foreground',
} as const;

export function ChangeCard({
  groupKey,
  entry,
  repoColorClass,
  readOnlyMode,
  onOpenDetail,
}: ChangeCardProps) {
  const sortKey = getEntrySortKey(entry);
  const dragId = getChangeDragId(groupKey, entry);
  const data: DragItemData = {
    kind: 'change',
    persistId: sortKey,
    label: `${entry.changeName}（${entry.repoName}）`,
    stage: entry.stage,
  };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: dragId, data, disabled: readOnlyMode });
  const pct = entry.progress.total > 0
    ? Math.round((entry.progress.completed / entry.progress.total) * 100)
    : 0;
  const blockingHint = entry.artifactStates
    .filter((artifact) => artifact.status === 'blocked' && artifact.blockedBy?.length)
    .map((artifact) => `${artifact.label} 等 ${artifact.blockedBy?.join('/')}`)
    .join('；');

  return (
    <Card
      ref={setNodeRef}
      size="sm"
      data-change-key={sortKey}
      className={cn(
        'gap-2 transition-[opacity,box-shadow]',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-ring/60',
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CardHeader className="gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
          <span className={cn('size-2 shrink-0 rounded-full', repoColorClass)} aria-hidden="true" />
          <span className="truncate font-medium">{entry.repoName}</span>
          <Badge variant="secondary" className="px-1.5 text-[10px]">{entry.repoRole}</Badge>
          {entry.sourceType === 'remote' && (
            <Badge variant="outline" className="ml-auto px-1.5 text-[10px]">远程</Badge>
          )}
        </div>
        <CardTitle className="truncate text-sm">{entry.changeName}</CardTitle>
        {entry.summary && <CardDescription className="line-clamp-2 text-xs">{entry.summary}</CardDescription>}
        <CardAction>
          <SortableDragHandle
            label={`拖动排序变更：${entry.changeName}（${entry.repoName}）`}
            disabled={readOnlyMode}
            listeners={listeners}
            attributes={attributes}
            setActivatorNodeRef={setActivatorNodeRef}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {entry.stage === 'planning' && (
          <>
            <div className="flex flex-wrap gap-1">
              {entry.artifactStates.map((artifact) => (
                <Badge
                  key={artifact.id}
                  variant="outline"
                  className={cn('px-1.5 text-[10px]', ARTIFACT_BADGE_CLASSES[artifact.status])}
                >
                  {artifact.status === 'done' && <Check data-icon="inline-start" />}
                  {artifact.status === 'next' && <ArrowRight data-icon="inline-start" />}
                  {artifact.status === 'blocked' && <Lock data-icon="inline-start" />}
                  {artifact.label}
                  {artifact.status === 'next' ? ' next' : ''}
                </Badge>
              ))}
            </div>
            {blockingHint && <p className="text-[10px] text-muted-foreground">{blockingHint}</p>}
          </>
        )}

        {(entry.stage === 'ready_to_apply' || entry.stage === 'in_progress' || entry.stage === 'complete') && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Tasks checked</span>
              <span>{entry.progress.completed} / {entry.progress.total}</span>
            </div>
            <Progress
              value={pct}
              aria-label={`${entry.changeName} 任务进度`}
              className={cn(
                'h-1.5',
                entry.stage === 'complete' && '[&_[data-slot=progress-indicator]]:bg-success',
                entry.stage === 'in_progress' && '[&_[data-slot=progress-indicator]]:bg-warning',
              )}
            />
          </div>
        )}

        {entry.stage === 'archived' && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Archive className="size-3 shrink-0 text-success" />
            <span className="truncate">归档于 {formatArchiveTime(entry.archivedAt, entry.archivedDate)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={`打开变更：${entry.changeName}（${entry.repoName}）`}
          onClick={() => onOpenDetail(groupKey, entry.repoId)}
        >
          打开变更
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
}
