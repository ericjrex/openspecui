import { GripVertical } from 'lucide-react';
import type { useSortable } from '@dnd-kit/sortable';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface SortableDragHandleProps {
  label: string;
  disabled?: boolean;
  listeners?: ReturnType<typeof useSortable>['listeners'];
  attributes?: ReturnType<typeof useSortable>['attributes'];
  setActivatorNodeRef: (element: HTMLButtonElement | null) => void;
  className?: string;
}

export function SortableDragHandle({
  label,
  disabled = false,
  listeners,
  attributes,
  setActivatorNodeRef,
  className,
}: SortableDragHandleProps) {
  if (disabled) {
    return null;
  }

  return (
    <Button
      ref={setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={`${label}（空格键开始，方向键移动）`}
      className={cn('touch-none cursor-grab text-muted-foreground active:cursor-grabbing', className)}
      {...attributes}
      {...listeners}
    >
      <GripVertical data-icon="inline-start" />
    </Button>
  );
}
