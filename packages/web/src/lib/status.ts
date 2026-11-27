import type { ArtifactNodeStatus, ChangeStage, DeltaOperation, GitFileDiff } from '@openspecui/shared';

export interface StatusMeta {
  label: string;
  className: string;
}

export const STAGE_META: Record<ChangeStage, StatusMeta> = {
  planning: { label: 'Planning', className: 'text-info' },
  ready_to_apply: { label: 'Ready to apply', className: 'text-indigo' },
  in_progress: { label: 'In progress', className: 'text-warning' },
  complete: { label: 'Complete', className: 'text-success' },
  archived: { label: 'Archived', className: 'text-muted-foreground' },
};

export const ARTIFACT_STATUS_META: Record<ArtifactNodeStatus, StatusMeta> = {
  done: { label: '已完成', className: 'text-success' },
  next: { label: '下一步', className: 'text-info' },
  blocked: { label: '被阻塞', className: 'text-muted-foreground' },
};

export const DELTA_STATUS_META: Record<DeltaOperation, StatusMeta> = {
  ADDED: { label: '新增', className: 'border-success/30 bg-diff-added text-success' },
  MODIFIED: { label: '修改', className: 'border-warning/30 bg-diff-modified text-warning' },
  REMOVED: { label: '移除', className: 'border-destructive/30 bg-diff-removed text-destructive' },
  RENAMED: { label: '重命名', className: 'border-violet/30 bg-diff-renamed text-violet' },
};

export const GIT_FILE_STATUS_META: Record<GitFileDiff['status'], StatusMeta> = {
  added: { label: 'added', className: 'border-success/30 bg-diff-added text-success' },
  modified: { label: 'modified', className: 'border-warning/30 bg-diff-modified text-warning' },
  deleted: { label: 'deleted', className: 'border-destructive/30 bg-diff-removed text-destructive' },
  renamed: { label: 'renamed', className: 'border-violet/30 bg-diff-renamed text-violet' },
  binary: { label: 'binary', className: 'border-border bg-secondary text-muted-foreground' },
};

export const REPO_COLOR_CLASSES = [
  'bg-repo-sky',
  'bg-repo-emerald',
  'bg-repo-violet',
  'bg-repo-amber',
  'bg-repo-rose',
  'bg-repo-cyan',
] as const;

export function getRepoColorClass(repoId: string): string {
  let hash = 0;
  for (let index = 0; index < repoId.length; index += 1) {
    hash = (hash * 31 + repoId.charCodeAt(index)) >>> 0;
  }
  return REPO_COLOR_CLASSES[hash % REPO_COLOR_CLASSES.length];
}
