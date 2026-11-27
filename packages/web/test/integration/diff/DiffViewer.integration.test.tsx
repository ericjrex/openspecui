import type { GitDiffResult } from '@openspecui/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DiffViewer } from '@/components/DiffViewer';

const longLine = `+${'x'.repeat(320)}`;

const diff: GitDiffResult = {
  repoId: 'repo-local',
  target: 'working-tree',
  truncated: true,
  files: [
    {
      path: 'src/example.ts',
      status: 'modified',
      truncated: true,
      patch: ['@@ -1 +1 @@', '-old', '+new', longLine].join('\n'),
    },
    {
      path: 'assets/logo.png',
      status: 'binary',
      truncated: false,
      patch: 'Binary files a/assets/logo.png and b/assets/logo.png differ',
    },
  ],
};

describe('DiffViewer', () => {
  it('renders real loading and empty states', () => {
    const { rerender } = render(<DiffViewer diff={null} loading />);

    expect(screen.getByRole('status')).toHaveTextContent('正在加载代码 Diff...');
    expect(screen.getByRole('status').querySelector('[data-slot="spinner"]')).not.toBeNull();

    rerender(<DiffViewer diff={null} />);

    expect(
      screen.getByText('点击左侧的未提交工作区或任意 Commit 查看代码变更详情（只读）'),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-slot="empty"]')).not.toBeNull();
  });

  it('switches between Unified and Split while preserving binary output and Diff tokens', async () => {
    const user = userEvent.setup();
    render(<DiffViewer diff={diff} title="工作区差异" />);

    expect(screen.getByText('工作区差异')).toBeInTheDocument();
    expect(screen.getByText('2 个文件')).toBeInTheDocument();
    expect(screen.getByText('文件数超上限，仅展示部分')).toHaveClass(
      'bg-diff-modified',
      'text-warning',
    );
    expect(screen.getByRole('radio', { name: 'Unified 视图' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const unifiedScrollArea = screen.getByRole('region', { name: 'src/example.ts 统一差异' });
    expect(unifiedScrollArea).toHaveAttribute('data-slot', 'scroll-area');
    expect(unifiedScrollArea).toHaveClass('max-h-96');
    expect(unifiedScrollArea.querySelector('.overflow-x-auto')).not.toBeNull();
    expect(unifiedScrollArea.querySelector('pre')).toHaveClass('w-max', 'min-w-full');
    expect(screen.getByText('+new', { exact: true })).toHaveClass('bg-diff-added', 'text-success');
    expect(screen.getByText('-old', { exact: true })).toHaveClass(
      'bg-diff-removed',
      'text-destructive',
    );
    expect(screen.getByText('@@ -1 +1 @@')).toHaveClass('bg-diff-info', 'text-info');
    expect(screen.getByText(longLine)).toBeInTheDocument();
    expect(screen.getByText('modified')).toHaveClass('bg-diff-modified', 'text-warning');
    expect(screen.getByRole('alert')).toHaveTextContent('内容已截断');

    await user.click(screen.getByRole('radio', { name: 'Split 视图' }));

    expect(screen.queryByRole('region', { name: 'src/example.ts 统一差异' })).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'src/example.ts 左右差异' })).toHaveAttribute(
      'data-slot',
      'table',
    );
    expect(screen.getByRole('cell', { name: 'old' })).toHaveClass(
      'bg-diff-removed',
      'text-destructive',
    );
    expect(screen.getByRole('cell', { name: 'new' })).toHaveClass(
      'bg-diff-added',
      'text-success',
    );
    expect(screen.getByRole('region', { name: 'assets/logo.png 统一差异' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="scroll-area-viewport"]').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('radio', { name: 'Unified 视图' }));

    expect(screen.getByRole('region', { name: 'src/example.ts 统一差异' })).toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'src/example.ts 左右差异' }),
    ).not.toBeInTheDocument();
  });

  it('renders an empty state when the selected target contains no files', () => {
    render(
      <DiffViewer
        diff={{
          repoId: 'repo-local',
          target: 'working-tree',
          truncated: false,
          files: [],
        }}
      />,
    );

    expect(screen.getByText('当前目标没有可展示的文本差异')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="empty"]')).not.toBeNull();
  });
});
