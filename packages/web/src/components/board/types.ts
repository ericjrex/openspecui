import type { ChangeStage, RepoChangeEntry } from '@openspecui/shared';

export type BoardTab = 'board' | 'archive' | 'specs';
export type LayoutMode = 'stages' | 'by-repo' | 'cross-repo';
export type SortMode = 'custom' | 'name-asc' | 'name-desc' | 'least-done' | 'most-done';
export type DragKind = 'repo' | 'idea' | 'change' | 'group';

export interface DragItemData {
  kind: DragKind;
  persistId: string;
  label: string;
  stage?: ChangeStage;
}

export interface FlatChangeEntry {
  groupKey: string;
  entry: RepoChangeEntry;
}

export function getEntrySortKey(entry: RepoChangeEntry): string {
  return `${entry.repoId}:${entry.changeName}`;
}

export function getChangeDragId(groupKey: string, entry: RepoChangeEntry): string {
  return `change:${groupKey}:${entry.repoId}:${entry.changeName}:${entry.archiveFolderName ?? 'active'}`;
}

export function reorderStringList(baseIds: string[], fromId: string, toId: string): string[] {
  const unique = Array.from(new Set(baseIds));
  const fromIndex = unique.indexOf(fromId);
  const toIndex = unique.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return unique;
  }
  const next = [...unique];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function canDropOn(active: DragItemData | undefined, over: DragItemData | undefined): boolean {
  if (!active || !over || active.kind !== over.kind) {
    return false;
  }
  return active.kind !== 'change' || active.stage === over.stage;
}
