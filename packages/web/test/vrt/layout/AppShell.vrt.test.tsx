import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { testConfig } from '#test/config';
import { EmptyState } from '@/components/common/EmptyState';
import { InlineAlert } from '@/components/common/InlineAlert';
import { ReadOnlyBanner } from '@/components/layout/ReadOnlyBanner';

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
  test(`app shell ${theme}`, async () => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    await act(async () => {
      root.render(
        <div className="min-h-screen bg-background text-foreground">
          <ReadOnlyBanner />
          <main className="space-y-4 p-6">
            <InlineAlert variant="destructive">加载工作区失败，请重试</InlineAlert>
            <EmptyState title="欢迎使用 OpenSpecUI" description="创建一个逻辑工作区，绑定本地仓库并统一预览 Specs 与 Git 变更。" />
          </main>
        </div>,
      );
    });
    const viewportLabel = window.innerWidth < 768 ? 'mobile' : 'desktop';
    await expect.element(page.getByText('欢迎使用 OpenSpecUI')).toMatchScreenshot(`app-shell-${theme}-${viewportLabel}`, {
      comparatorName: 'pixelmatch',
      comparatorOptions: { allowedMismatchedPixelRatio: testConfig.vrtMismatchedPixelRatio },
    });
  });
}
