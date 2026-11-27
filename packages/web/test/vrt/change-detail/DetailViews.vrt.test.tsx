import type { GitDiffResult } from '@openspecui/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { testConfig } from '#test/config';
import { DiffViewer } from '@/components/DiffViewer';
import { MarkdownViewer } from '@/components/MarkdownViewer';

const sampleDiff: GitDiffResult = {
  repoId: 'repo-1',
  target: 'working-tree',
  truncated: false,
  files: [
    {
      path: 'README.md',
      status: 'modified',
      truncated: false,
      patch: '@@ -1,2 +1,2 @@\n-旧的介绍\n+新的介绍\n 保留的行',
    },
  ],
};

const sampleMarkdown = '# Proposal\n\n## Why\n\n统一预览 Specs 与 Git 变更。\n\n- [ ] 实现登录接口\n- [x] 搭建工程骨架\n';

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
  test(`detail views ${theme}`, async () => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    await act(async () => {
      root.render(
        <div className="min-h-screen space-y-4 bg-background p-6 text-foreground">
          <MarkdownViewer content={sampleMarkdown} title="proposal.md" />
          <DiffViewer diff={sampleDiff} title="未提交工作区" />
        </div>,
      );
    });
    const viewportLabel = window.innerWidth < 768 ? 'mobile' : 'desktop';
    await expect.element(page.getByText('Proposal')).toMatchScreenshot(`detail-views-${theme}-${viewportLabel}`, {
      comparatorName: 'pixelmatch',
      comparatorOptions: { allowedMismatchedPixelRatio: testConfig.vrtMismatchedPixelRatio },
    });
  });
}
