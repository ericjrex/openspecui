import { describe, expect, it } from 'vitest';
import { buildSplitRows } from '@/lib/diff';

describe('buildSplitRows', () => {
  it('pairs deleted and added lines', () => {
    const rows = buildSplitRows('@@ -1 +1 @@\n-old\n+new');
    expect(rows).toEqual([
      { left: '@@ -1 +1 @@', right: '@@ -1 +1 @@', leftType: 'hunk', rightType: 'hunk' },
      { left: 'old', right: 'new', leftType: 'del', rightType: 'add' },
    ]);
  });

  it('keeps context rows and ignores file headers', () => {
    const rows = buildSplitRows('diff --git a/a b/a\n--- a/a\n+++ b/a\n same');
    expect(rows).toEqual([{ left: 'same', right: 'same', leftType: 'context', rightType: 'context' }]);
  });
});
