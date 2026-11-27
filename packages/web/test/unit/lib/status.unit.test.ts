import { describe, expect, it } from 'vitest';
import { ARTIFACT_STATUS_META, DELTA_STATUS_META, getRepoColorClass, STAGE_META } from '@/lib/status';

describe('status mappings', () => {
  it('preserves every lifecycle stage', () => {
    expect(Object.keys(STAGE_META)).toEqual(['planning', 'ready_to_apply', 'in_progress', 'complete', 'archived']);
    expect(STAGE_META.complete.className).toBe('text-success');
  });

  it('preserves artifact and delta semantic classes', () => {
    expect(ARTIFACT_STATUS_META.next.className).toBe('text-info');
    expect(DELTA_STATUS_META.ADDED.className).toContain('bg-diff-added');
    expect(DELTA_STATUS_META.REMOVED.className).toContain('text-destructive');
  });

  it('returns a stable repository color', () => {
    expect(getRepoColorClass('repo-1')).toBe(getRepoColorClass('repo-1'));
    expect(getRepoColorClass('repo-1')).toMatch(/^bg-repo-/);
  });
});
