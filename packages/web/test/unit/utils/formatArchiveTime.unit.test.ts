import { describe, expect, it } from 'vitest';
import { compareArchivedEntriesDesc, formatArchiveTime, getArchiveSortTimestamp } from '@/utils/formatArchiveTime';

describe('archive time helpers', () => {
  it('formats a date-only archive entry', () => {
    expect(formatArchiveTime(undefined, '2026-11-26')).toBe('2026-11-26');
  });

  it('uses the precise timestamp when available', () => {
    expect(getArchiveSortTimestamp({ archivedAt: '2026-11-26T10:00:00.000Z', archivedDate: '2026-11-26' })).toBe(
      Date.parse('2026-11-26T10:00:00.000Z'),
    );
  });

  it('sorts by archive date before filesystem time', () => {
    const older = { archivedDate: '2026-11-25', archivedAt: '2026-11-27T10:00:00.000Z', changeName: 'older' };
    const newer = { archivedDate: '2026-11-26', archivedAt: '2026-11-20T10:00:00.000Z', changeName: 'newer' };
    expect([older, newer].sort(compareArchivedEntriesDesc).map((entry) => entry.changeName)).toEqual(['newer', 'older']);
  });
});
