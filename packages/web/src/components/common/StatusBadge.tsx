import type { StatusMeta } from '../../lib/status';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

interface StatusBadgeProps {
  meta: StatusMeta;
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ meta, children, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium', meta.className, className)}>
      {children ?? meta.label}
    </Badge>
  );
}
