import type { SpecRequirementChangeItem } from '@openspecui/shared';
import { ArrowRight, GitCommitHorizontal, Minus, Pencil, Plus, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';

const OPERATION_META = {
  CREATED: { label: '初始创建', icon: Sparkles, variant: 'default' },
  ADDED: { label: '追加功能点', icon: Plus, variant: 'outline' },
  MODIFIED: { label: '修改功能点', icon: Pencil, variant: 'outline' },
  RENAMED: { label: '重命名', icon: GitCommitHorizontal, variant: 'secondary' },
  REMOVED: { label: '移除功能点', icon: Minus, variant: 'destructive' },
} as const;

export function RequirementChangeRow({ item }: { item: SpecRequirementChangeItem }) {
  const meta = OPERATION_META[item.operation];
  const Icon = meta.icon;
  const matchBadge =
    item.operation === 'RENAMED' && item.matchSource === 'delta'
      ? 'Delta 声明'
      : item.operation === 'RENAMED' && item.similarity !== undefined
        ? `相似度 ${item.similarity}%`
        : null;

  return (
    <Item role="listitem" variant="muted" size="xs" className="items-start gap-2">
      <ItemMedia variant="icon">
        <Icon aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="flex-wrap gap-1.5 whitespace-normal">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {item.operation === 'RENAMED' ? (
            <>
              {item.fromName && <span className="break-all line-through">{item.fromName}</span>}
              <ArrowRight aria-hidden="true" />
              <span className="break-all font-medium">{item.name}</span>
            </>
          ) : (
            <span className="break-all font-medium">{item.name}</span>
          )}
          {matchBadge && <Badge variant="outline">{matchBadge}</Badge>}
        </ItemTitle>
        {item.operation === 'RENAMED' && (!item.fromName || item.fromName === item.name) && (
          <ItemDescription>Requirement 标题发生变化</ItemDescription>
        )}
      </ItemContent>
    </Item>
  );
}
