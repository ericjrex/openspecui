import { Archive, Clock, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { cn } from '../../lib/utils';
import { formatArchiveTime } from '../../utils/formatArchiveTime';
import type { FlatChangeEntry } from './types';

interface ArchiveViewProps {
  entries: FlatChangeEntry[];
  repoColorMap: Map<string, string>;
  searchText: string;
  onSearchChange: (value: string) => void;
  onOpenDetail: (groupKey: string, focusRepoId?: string) => void;
}

export function ArchiveView({
  entries,
  repoColorMap,
  searchText,
  onSearchChange,
  onOpenDetail,
}: ArchiveViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InputGroup className="w-full sm:w-64">
          <InputGroupInput
            type="search"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search archived changes..."
            aria-label="搜索归档变更"
          />
          <InputGroupAddon align="inline-start"><Search /></InputGroupAddon>
        </InputGroup>
        <span className="text-xs text-muted-foreground">
          按归档时间倒序 · 共 {entries.length} 个已归档变更（点击打开按钮只读查看详情）
        </span>
      </div>

      {entries.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>当前筛选下暂无已归档变更</EmptyTitle>
            <EmptyDescription>openspec/changes/archive/</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map(({ groupKey, entry }) => {
            const pct = entry.progress.total > 0
              ? Math.round((entry.progress.completed / entry.progress.total) * 100)
              : 0;
            return (
              <Card key={`${entry.repoId}:${entry.archiveFolderName ?? entry.changeName}`} size="sm" className="gap-2">
                <CardHeader className="gap-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn('size-2 shrink-0 rounded-full', repoColorMap.get(entry.repoId) ?? 'bg-repo-sky')}
                      aria-hidden="true"
                    />
                    <Badge variant="secondary" className="px-1.5 text-[10px]">{entry.repoRole}</Badge>
                    <span className="truncate text-xs text-muted-foreground">{entry.repoName}</span>
                  </div>
                  <CardTitle className="truncate text-sm">{entry.changeName}</CardTitle>
                  {entry.archiveFolderName && entry.archiveFolderName !== entry.changeName && (
                    <div className="truncate font-mono text-[11px] text-muted-foreground">{entry.archiveFolderName}</div>
                  )}
                  {entry.summary && <p className="line-clamp-2 text-xs text-muted-foreground">{entry.summary}</p>}
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Badge variant="outline" className="w-fit border-success/30 bg-success/10 text-success">
                    <Clock data-icon="inline-start" />
                    {formatArchiveTime(entry.archivedAt, entry.archivedDate)}
                  </Badge>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Tasks: {entry.progress.completed}/{entry.progress.total} ({pct}%)</span>
                    <span>Delta Specs: {entry.deltaDiffs.length}</span>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-label={`打开归档变更：${entry.changeName}（${entry.repoName}）`}
                    onClick={() => onOpenDetail(groupKey, entry.repoId)}
                  >
                    <Archive data-icon="inline-start" /> 打开归档变更
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
