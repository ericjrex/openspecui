import type { GitFileDiff } from '@openspecui/shared';
import type { SplitRow } from '../../lib/diff';

export type UnifiedDiffLineKind = 'added' | 'removed' | 'info' | 'context';

const UNIFIED_LINE_CLASS_NAMES: Record<UnifiedDiffLineKind, string> = {
  added: 'bg-diff-added text-success',
  removed: 'bg-diff-removed text-destructive',
  info: 'bg-diff-info text-info',
  context: 'text-foreground-muted',
};

const SPLIT_CELL_CLASS_NAMES: Record<SplitRow['leftType'] | SplitRow['rightType'], string> = {
  add: 'bg-diff-added text-success',
  del: 'bg-diff-removed text-destructive',
  hunk: 'bg-diff-info text-info',
  empty: 'bg-muted/30',
  context: 'text-foreground-muted',
};

export const DIFF_STATUS_BADGE_CLASS_NAMES: Record<GitFileDiff['status'], string> = {
  added: 'border-success/30 bg-diff-added text-success',
  modified: 'border-warning/30 bg-diff-modified text-warning',
  deleted: 'border-destructive/30 bg-diff-removed text-destructive',
  renamed: 'border-violet/30 bg-diff-renamed text-violet',
  binary: 'border-border bg-muted text-muted-foreground',
};

export function getUnifiedDiffLineKind(line: string): UnifiedDiffLineKind {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return 'added';
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return 'removed';
  }
  if (line.startsWith('@@')) {
    return 'info';
  }
  return 'context';
}

export function getUnifiedDiffLineClassName(line: string): string {
  return UNIFIED_LINE_CLASS_NAMES[getUnifiedDiffLineKind(line)];
}

export function getSplitDiffCellClassName(type: SplitRow['leftType'] | SplitRow['rightType']): string {
  return SPLIT_CELL_CLASS_NAMES[type];
}
