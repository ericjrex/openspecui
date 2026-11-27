import { describe, expect, it } from 'vitest';
import { buildSplitRows } from '@/lib/diff';
import {
  DIFF_STATUS_BADGE_CLASS_NAMES,
  getSplitDiffCellClassName,
  getUnifiedDiffLineClassName,
  getUnifiedDiffLineKind,
} from '@/components/diff/diffStyles';

describe('Diff pure logic', () => {
  it('classifies unified diff lines without treating file headers as changes', () => {
    expect(getUnifiedDiffLineKind('+added')).toBe('added');
    expect(getUnifiedDiffLineKind('-removed')).toBe('removed');
    expect(getUnifiedDiffLineKind('@@ -1 +1 @@')).toBe('info');
    expect(getUnifiedDiffLineKind('+++ b/file.ts')).toBe('context');
    expect(getUnifiedDiffLineKind('--- a/file.ts')).toBe('context');
    expect(getUnifiedDiffLineKind(' context')).toBe('context');
    expect(getUnifiedDiffLineKind('')).toBe('context');
  });

  it('uses semantic Diff tokens for unified line styles', () => {
    expect(getUnifiedDiffLineClassName('+added')).toBe('bg-diff-added text-success');
    expect(getUnifiedDiffLineClassName('-removed')).toBe('bg-diff-removed text-destructive');
    expect(getUnifiedDiffLineClassName('@@ -1 +1 @@')).toBe('bg-diff-info text-info');
    expect(getUnifiedDiffLineClassName(' context')).toBe('text-foreground-muted');
  });

  it('uses semantic Diff tokens for split cells and file statuses', () => {
    expect(getSplitDiffCellClassName('add')).toBe('bg-diff-added text-success');
    expect(getSplitDiffCellClassName('del')).toBe('bg-diff-removed text-destructive');
    expect(getSplitDiffCellClassName('hunk')).toBe('bg-diff-info text-info');
    expect(getSplitDiffCellClassName('empty')).toBe('bg-muted/30');
    expect(getSplitDiffCellClassName('context')).toBe('text-foreground-muted');

    expect(DIFF_STATUS_BADGE_CLASS_NAMES).toEqual({
      added: 'border-success/30 bg-diff-added text-success',
      modified: 'border-warning/30 bg-diff-modified text-warning',
      deleted: 'border-destructive/30 bg-diff-removed text-destructive',
      renamed: 'border-violet/30 bg-diff-renamed text-violet',
      binary: 'border-border bg-muted text-muted-foreground',
    });
  });

  it('pairs unequal deletion and addition queues and preserves empty sides', () => {
    const rows = buildSplitRows('@@ -1,2 +1,3 @@\n-old-one\n-old-two\n+new-one\n+new-two\n+new-three');

    expect(rows).toEqual([
      { left: '@@ -1,2 +1,3 @@', right: '@@ -1,2 +1,3 @@', leftType: 'hunk', rightType: 'hunk' },
      { left: 'old-one', right: 'new-one', leftType: 'del', rightType: 'add' },
      { left: 'old-two', right: 'new-two', leftType: 'del', rightType: 'add' },
      { left: undefined, right: 'new-three', leftType: 'empty', rightType: 'add' },
    ]);
  });

  it('flushes change queues at context lines, hunk headers, and the end of the patch', () => {
    const patch = [
      'diff --git a/file.ts b/file.ts',
      '--- a/file.ts',
      '+++ b/file.ts',
      '@@ -1 +1 @@',
      '-old',
      '+new',
      ' context',
      '@@ -10 +10 @@',
      '-before',
      '+after',
      '',
    ].join('\r\n');

    expect(buildSplitRows(patch)).toEqual([
      { left: '@@ -1 +1 @@', right: '@@ -1 +1 @@', leftType: 'hunk', rightType: 'hunk' },
      { left: 'old', right: 'new', leftType: 'del', rightType: 'add' },
      { left: 'context', right: 'context', leftType: 'context', rightType: 'context' },
      { left: '@@ -10 +10 @@', right: '@@ -10 +10 @@', leftType: 'hunk', rightType: 'hunk' },
      { left: 'before', right: 'after', leftType: 'del', rightType: 'add' },
      { left: '', right: '', leftType: 'context', rightType: 'context' },
    ]);
  });
});
