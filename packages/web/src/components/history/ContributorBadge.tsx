import type { SpecContributorSummary } from '@openspecui/shared';
import { Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Item } from '../ui/item';

interface ContributorBadgeProps {
  contributor: SpecContributorSummary;
}

export function ContributorBadge({ contributor }: ContributorBadgeProps) {
  const title = contributor.authorEmail
    ? `${contributor.authorName} <${contributor.authorEmail}>`
    : contributor.authorName;

  return (
    <Item
      role="listitem"
      variant="outline"
      size="xs"
      title={title}
      className="w-auto max-w-full rounded-full px-2.5 py-1"
    >
      {contributor.isCreator && (
        <Badge variant="default">
          <Sparkles data-icon="inline-start" aria-hidden="true" />
          创建者
        </Badge>
      )}
      <span className="font-medium">{contributor.authorName}</span>
      <span className="text-[11px] text-muted-foreground">({contributor.commitCount} 次)</span>
      {contributor.addedCount > 0 && <Badge variant="outline">+{contributor.addedCount} 新增</Badge>}
      {contributor.modifiedCount > 0 && <Badge variant="outline">~{contributor.modifiedCount} 修改</Badge>}
      {contributor.renamedCount > 0 && <Badge variant="secondary">&gt;{contributor.renamedCount} 重命名</Badge>}
      {contributor.removedCount > 0 && <Badge variant="destructive">-{contributor.removedCount} 移除</Badge>}
    </Item>
  );
}
