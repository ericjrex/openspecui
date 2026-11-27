import type { SpecRevisionEntry } from '@openspecui/shared';
import { AlertTriangle, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Item, ItemGroup } from '../ui/item';
import { RequirementChangeRow } from './RequirementChangeRow';

function formatCommitDate(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return iso;
  }
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface RevisionItemProps {
  revision: SpecRevisionEntry;
  currentPath: string;
}

export function RevisionItem({ revision, currentPath }: RevisionItemProps) {
  const isLargeInitial =
    revision.operations.length === 1 &&
    revision.operations[0] === 'CREATED' &&
    revision.changes.length > 5;
  const [expanded, setExpanded] = useState(!isLargeInitial);
  const pathMoved = revision.filePathAtCommit && revision.filePathAtCommit !== currentPath;

  return (
    <Item
      role="listitem"
      variant="outline"
      size="sm"
      aria-label={`${revision.shortSha} ${revision.subject}`}
      className="flex-col items-stretch gap-2"
    >
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto w-full flex-wrap justify-between gap-2 px-0 py-1 text-left"
            aria-label={`${expanded ? '收起' : '展开'} ${revision.shortSha} 功能点清单`}
            title={expanded ? '收起功能点清单' : '展开功能点清单'}
          >
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              {expanded ? (
                <ChevronDown data-icon="inline-start" aria-hidden="true" />
              ) : (
                <ChevronRight data-icon="inline-start" aria-hidden="true" />
              )}
              <Badge variant="outline" className="font-mono">{revision.shortSha}</Badge>
              <span className="font-medium">{revision.authorName}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock data-icon="inline-start" aria-hidden="true" />
                {formatCommitDate(revision.committedAt)}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <RevisionCounts revision={revision} />
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {expanded && revision.analyzed && (
            <div className="pt-2">
              {revision.changes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  本次提交未增删或修改 Requirement 条目（仅调整 Purpose 或排版）。
                </p>
              ) : (
                <ItemGroup aria-label={`${revision.shortSha} Requirement 变更`}>
                  {revision.changes.map((item, index) => (
                    <RequirementChangeRow
                      key={`${revision.sha}-${item.operation}-${item.name}-${index}`}
                      item={item}
                    />
                  ))}
                </ItemGroup>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
      <p className="text-xs text-muted-foreground">{revision.subject}</p>
      {pathMoved && (
        <p className="font-mono text-[11px] text-muted-foreground">
          历史路径: {revision.filePathAtCommit}
        </p>
      )}
    </Item>
  );
}

function RevisionCounts({ revision }: { revision: SpecRevisionEntry }) {
  if (!revision.analyzed) {
    return <Badge variant="outline">未拉取快照</Badge>;
  }

  return (
    <>
      {revision.counts.created > 0 && <Badge variant="secondary">初始 {revision.counts.created} 条</Badge>}
      {revision.counts.added > 0 && <Badge variant="outline">+{revision.counts.added} 追加</Badge>}
      {revision.counts.modified > 0 && <Badge variant="outline">~{revision.counts.modified} 修改</Badge>}
      {revision.counts.renamed > 0 && <Badge variant="secondary">&gt;{revision.counts.renamed} 重命名</Badge>}
      {revision.counts.removed > 0 && (
        <Badge variant="destructive">
          <AlertTriangle data-icon="inline-start" aria-hidden="true" />
          -{revision.counts.removed} 移除以前功能点
        </Badge>
      )}
      {revision.operations.includes('DOCS_UPDATED') && <Badge variant="ghost">仅文档/背景修订</Badge>}
    </>
  );
}
