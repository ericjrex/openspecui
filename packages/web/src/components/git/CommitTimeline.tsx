import type { GitCommitItem } from '@openspecui/shared';
import { AlertTriangle, GitCommitHorizontal, RefreshCw } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { Item, ItemGroup } from '../ui/item';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';

interface CommitTimelineProps {
  commits: GitCommitItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onInspect: (commit: GitCommitItem) => void;
}

export function CommitTimeline({ commits, loading, error, onRefresh, onInspect }: CommitTimelineProps) {
  return (
    <Card className="min-w-0 lg:col-span-2">
      <CardHeader>
        <CardTitle>跨仓混合 Git 活动时间线</CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="刷新 Git 活动时间线"
            title="刷新 Git 活动时间线"
            onClick={onRefresh}
          >
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading && (
          <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner aria-label="正在加载 Git 活动时间线" />
            正在加载 Git 活动时间线...
          </div>
        )}
        {loading && commits.length === 0 && (
          <div aria-hidden="true" className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>加载 Git 活动时间线失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <AlertAction>
              <Button type="button" variant="outline" size="xs" onClick={onRefresh}>
                重试
              </Button>
            </AlertAction>
          </Alert>
        )}
        {!loading && !error && commits.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GitCommitHorizontal aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>暂无近期 Git 提交记录</EmptyTitle>
              <EmptyDescription>绑定仓库并产生提交后，这里会按时间汇总各仓库活动。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : commits.length > 0 ? (
          <ScrollArea className="h-[60vh]">
            <ItemGroup aria-label="Git 提交时间线">
              {commits.map((commit) => (
                <Item key={`${commit.repoId}:${commit.sha}`} role="listitem" size="sm" className="p-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto w-full flex-wrap justify-start gap-2 px-2 py-2 text-left"
                    aria-label={`查看 ${commit.repoRole} ${commit.subject} 的代码 Diff`}
                    onClick={() => onInspect(commit)}
                  >
                    <GitCommitHorizontal data-icon="inline-start" className="text-primary" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Badge variant="secondary">{commit.repoRole}</Badge>
                        <span className="truncate font-medium">{commit.subject}</span>
                      </span>
                      <span className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="font-mono">{commit.shortSha}</span>
                        <span>{commit.author}</span>
                        <span>{new Date(commit.committedAt).toLocaleString()}</span>
                        <span>{commit.filesChanged} 文件</span>
                      </span>
                    </span>
                  </Button>
                </Item>
              ))}
            </ItemGroup>
          </ScrollArea>
        ) : null}
      </CardContent>
    </Card>
  );
}
