import type { GitCommitItem, GitRepoStatus, SpecContributorSummary } from '@openspecui/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { testConfig } from '#test/config';
import { ContributorBadge } from '@/components/history/ContributorBadge';
import { BranchSelect } from '@/components/git/BranchSelect';
import { CommitTimeline } from '@/components/git/CommitTimeline';

const status: GitRepoStatus = {
  repoId: 'repo-1',
  repoName: 'openspecui',
  repoRole: 'MAIN',
  sourceType: 'local',
  isGitRepo: true,
  branch: 'master',
  ahead: 0,
  behind: 0,
  dirtyCount: 1,
  dirtyFiles: [{ path: 'README.md', status: 'modified' }],
  branches: ['master', 'refactor/frontend-shadcn-vitest'],
};

const commits: GitCommitItem[] = [
  {
    sha: 'abc123def456',
    shortSha: 'abc123d',
    repoId: 'repo-1',
    repoName: 'openspecui',
    repoRole: 'MAIN',
    branchRef: 'master',
    subject: 'docs: add acknowledgement',
    author: 'ypc',
    committedAt: '2026-11-27T03:00:00.000Z',
    filesChanged: 1,
  },
];

const contributor: SpecContributorSummary = {
  contributorKey: 'ypc',
  authorName: 'ypc',
  authorEmail: 'ypc@example.com',
  isCreator: true,
  commitCount: 3,
  lastCommittedAt: '2026-11-27T03:00:00.000Z',
  createdCount: 1,
  addedCount: 2,
  modifiedCount: 1,
  renamedCount: 0,
  removedCount: 0,
};

let container: HTMLDivElement;
let root: Root;

test.beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

test.afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

for (const theme of ['dark', 'light'] as const) {
  test(`git views ${theme}`, async () => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    await act(async () => {
      root.render(
        <div className="min-h-screen space-y-4 bg-background p-6 text-foreground">
          <BranchSelect repoName="openspecui" status={status} disabled={false} switching={false} onChange={() => {}} />
          <CommitTimeline commits={commits} loading={false} error={null} onRefresh={() => {}} onInspect={() => {}} />
          <ContributorBadge contributor={contributor} />
        </div>,
      );
    });
    const viewportLabel = window.innerWidth < 768 ? 'mobile' : 'desktop';
    await expect.element(page.getByText('跨仓混合 Git 活动时间线')).toMatchScreenshot(`git-views-${theme}-${viewportLabel}`, {
      comparatorName: 'pixelmatch',
      comparatorOptions: { allowedMismatchedPixelRatio: testConfig.vrtMismatchedPixelRatio },
    });
  });
}
