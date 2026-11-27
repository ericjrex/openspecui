import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { testConfig } from '#test/config';
import { STAGE_META } from '@/lib/status';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
  test(`board views ${theme}`, async () => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    await act(async () => {
      root.render(
        <div className="min-h-screen space-y-4 bg-background p-6 text-foreground">
          <Tabs defaultValue="board">
            <TabsList>
              <TabsTrigger value="board">Board 看板 (2)</TabsTrigger>
              <TabsTrigger value="archive">Archive 归档库 (2)</TabsTrigger>
              <TabsTrigger value="specs">Specs 规范库 (4)</TabsTrigger>
            </TabsList>
          </Tabs>
          <ToggleGroup type="single" variant="outline" size="sm" defaultValue="stages" aria-label="看板布局">
            <ToggleGroupItem value="stages">Stages</ToggleGroupItem>
            <ToggleGroupItem value="by-repo">By repo</ToggleGroupItem>
            <ToggleGroupItem value="cross-repo">跨仓聚合</ToggleGroupItem>
          </ToggleGroup>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>联合变更</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge meta={STAGE_META.planning}>Planning</StatusBadge>
                <StatusBadge meta={STAGE_META.in_progress}>In progress</StatusBadge>
                <StatusBadge meta={STAGE_META.complete}>Complete</StatusBadge>
              </div>
              <Progress value={62} aria-label="任务进度 62%" />
            </CardContent>
          </Card>
        </div>,
      );
    });
    const viewportLabel = window.innerWidth < 768 ? 'mobile' : 'desktop';
    await expect.element(page.getByText('联合变更')).toMatchScreenshot(`board-views-${theme}-${viewportLabel}`, {
      comparatorName: 'pixelmatch',
      comparatorOptions: { allowedMismatchedPixelRatio: testConfig.vrtMismatchedPixelRatio },
    });
  });
}
