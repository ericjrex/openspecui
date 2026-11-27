import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { testConfig } from '#test/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  test(`workspace forms ${theme}`, async () => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    await act(async () => {
      root.render(
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>新建逻辑工作区</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="vrt-workspace-name">逻辑工作区名称</FieldLabel>
                <Input id="vrt-workspace-name" defaultValue="电商系统（前后端联合）" />
                <FieldDescription>用于区分多个逻辑项目。</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="vrt-workspace-desc">描述</FieldLabel>
                <Textarea id="vrt-workspace-desc" defaultValue="前端与后端各自维护 openspec/" rows={2} />
              </Field>
              <Field>
                <FieldLabel htmlFor="vrt-repo-kind">仓库类型</FieldLabel>
                <Select defaultValue="hybrid">
                  <SelectTrigger id="vrt-repo-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">代码 + OpenSpec</SelectItem>
                    <SelectItem value="code">纯代码仓</SelectItem>
                    <SelectItem value="store">独立 Store 仓</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="vrt-show-git" defaultChecked />
                <FieldLabel htmlFor="vrt-show-git">同时显示纯 Git 仓</FieldLabel>
              </Field>
              <Button>创建并切换</Button>
            </CardContent>
          </Card>
        </div>,
      );
    });
    const viewportLabel = window.innerWidth < 768 ? 'mobile' : 'desktop';
    await expect.element(page.getByText('新建逻辑工作区')).toMatchScreenshot(`workspace-forms-${theme}-${viewportLabel}`, {
      comparatorName: 'pixelmatch',
      comparatorOptions: { allowedMismatchedPixelRatio: testConfig.vrtMismatchedPixelRatio },
    });
  });
}
