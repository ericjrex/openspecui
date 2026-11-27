/**
 * @file 主规范（Spec）作者、贡献者与 Requirement 级演进历史面板
 * @description 在「Specs 规范库」选中某条主规范时按需懒加载其 Git 演进记录，展示创建者、去重贡献者与每次提交的追加/修改/重命名/移除功能点清单。
 * @author ypc
 */

import type { SpecHistoryResponse } from '@openspecui/shared';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  History,
  Info,
  RefreshCw,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { Alert, AlertAction, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';
import { ItemGroup } from './ui/item';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Spinner } from './ui/spinner';
import { ContributorBadge } from './history/ContributorBadge';
import { RevisionItem } from './history/RevisionItem';

interface SpecHistoryPanelProps {
  repoId: string;
  capabilityPath: string;
}

export function SpecHistoryPanel({ repoId, capabilityPath }: SpecHistoryPanelProps) {
  const [limit, setLimit] = useState(20);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SpecHistoryResponse | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  useEffect(() => {
    setLimit(20);
  }, [repoId, capabilityPath]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getSpecHistory(repoId, capabilityPath, limit)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setLoading(false);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : '加载 Spec 演进历史失败',
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repoId, capabilityPath, limit, reloadSeq]);

  const retry = () => setReloadSeq((sequence) => sequence + 1);

  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
          <History className="size-4 text-primary" aria-hidden="true" />
          <span>作者与功能点演进追溯</span>
          {data?.isGitRepo && data.totalCommits > 0 && (
            <Badge variant="secondary">
              共 {data.totalCommits} 次提交 · {data.contributors.length} 位贡献者
            </Badge>
          )}
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={retry}
            disabled={loading}
            title="重新查询该 Spec 的 Git 历史"
          >
            {loading ? (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            ) : (
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
            )}
            刷新
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {loading && !data ? (
          <HistoryLoading />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>加载 Spec 演进历史失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <AlertAction>
              <Button type="button" variant="outline" size="xs" onClick={retry}>
                重试
              </Button>
            </AlertAction>
          </Alert>
        ) : data && (!data.isGitRepo || data.unavailableReason) ? (
          <Alert>
            <Info aria-hidden="true" />
            <AlertTitle>暂无 Git 演进历史</AlertTitle>
            <AlertDescription>{data.unavailableReason || '暂无 Git 提交历史记录'}</AlertDescription>
          </Alert>
        ) : data ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {data.creator && (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <UserCheck className="size-4 text-primary" aria-hidden="true" />
                    创建者：<strong className="font-semibold">{data.creator.authorName}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="size-4" aria-hidden="true" />
                  全部贡献者（按邮箱去重）：
                </span>
                {data.truncated && (
                  <Badge variant="outline">
                    当前仅分析最近 {data.analyzedCommits} 次提交快照（共 {data.totalCommits} 次）
                  </Badge>
                )}
              </div>
              <ItemGroup aria-label="Spec 贡献者" className="flex-row flex-wrap gap-1.5">
                {data.contributors.map((contributor) => (
                  <ContributorBadge key={contributor.contributorKey} contributor={contributor} />
                ))}
              </ItemGroup>
            </div>

            <Separator />

            <Collapsible open={timelineExpanded} onOpenChange={setTimelineExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  aria-label={timelineExpanded ? '收起演进清单' : `展开演进清单 (${data.revisions.length})`}
                >
                  <span className="inline-flex items-center gap-2">
                    <History data-icon="inline-start" aria-hidden="true" />
                    Requirement 演进时间线
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {timelineExpanded ? '收起演进清单' : `展开演进清单 (${data.revisions.length})`}
                    {timelineExpanded ? (
                      <ChevronDown data-icon="inline-end" aria-hidden="true" />
                    ) : (
                      <ChevronRight data-icon="inline-end" aria-hidden="true" />
                    )}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-2 pt-2">
                  {loading && data && (
                    <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Spinner aria-hidden="true" />
                      正在更新 Spec 演进历史...
                    </div>
                  )}
                  {data.revisions.length === 0 && !loading ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <History aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>暂无 Spec 演进记录</EmptyTitle>
                        <EmptyDescription>该规范还没有可分析的 Git 提交。</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <ScrollArea className="h-[340px]">
                      <ItemGroup aria-label="Spec 演进时间线">
                        {data.revisions.map((revision) => (
                          <RevisionItem
                            key={revision.sha}
                            revision={revision}
                            currentPath={data.specFilePath}
                          />
                        ))}
                      </ItemGroup>
                      {data.truncated && limit < 40 && (
                        <div className="flex justify-center pt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLimit(40)}
                            disabled={loading}
                          >
                            加载更多早期提交（最多分析最近 40 次）
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <p className="text-[11px] text-muted-foreground">
              注：基于 Git 提交历史与 Requirement 块级语义对比生成；重命名优先读取归档 Delta 声明，兜底按正文相似度自动识别。
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HistoryLoading() {
  return (
    <div className="flex flex-col gap-3">
      <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Spinner aria-label="正在加载 Spec 历史" />
        正在分析 Git 提交历史与 Requirement 语义变更...
      </div>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
