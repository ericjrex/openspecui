import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type InlineAlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

const variantClassNames: Record<InlineAlertVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  info: 'border-info/30 bg-diff-info text-info',
  success: 'border-success/30 bg-diff-added text-success',
  warning: 'border-warning/30 bg-diff-modified text-warning',
  destructive: 'border-destructive/40 bg-diff-removed text-destructive',
};

interface InlineAlertProps {
  variant?: InlineAlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function InlineAlert({ variant = 'default', title, children, className }: InlineAlertProps) {
  return (
    <Alert className={cn(variantClassNames[variant], className)}>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
