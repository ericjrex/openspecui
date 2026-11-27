import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';

interface LoadingStateProps {
  label: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 rounded-xl border border-border bg-card/40 p-12 text-sm text-muted-foreground', className)} role="status" aria-live="polite">
      <Spinner aria-hidden="true" />
      <span>{label}</span>
      <Skeleton className="sr-only" />
    </div>
  );
}
