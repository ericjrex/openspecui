import { ARTIFACT_STATUS_META } from '../../lib/status';

export type ArtifactTabId = 'proposal' | 'specs' | 'design' | 'tasks';

export function getArtifactStatusMeta(id: ArtifactTabId, statuses: { id: string; status: keyof typeof ARTIFACT_STATUS_META }[]) {
  const found = statuses.find((item) => item.id === id);
  return found ? ARTIFACT_STATUS_META[found.status] : null;
}
