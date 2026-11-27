import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmptyState } from '@/components/common/EmptyState';
import { IconButton } from '@/components/common/IconButton';
import { InlineAlert } from '@/components/common/InlineAlert';
import { LoadingState } from '@/components/common/LoadingState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { STAGE_META } from '@/lib/status';

describe('common components', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders an accessible icon button', async () => {
    const onClick = vi.fn();
    render(<IconButton label="刷新工作区" onClick={onClick}><span aria-hidden="true">↻</span></IconButton>);
    await userEvent.click(screen.getByRole('button', { name: '刷新工作区' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders status, empty, loading and alert content', () => {
    render(
      <>
        <StatusBadge meta={STAGE_META.complete}>Complete</StatusBadge>
        <EmptyState title="暂无变更" description="创建第一个 Change" />
        <LoadingState label="正在加载工作区" />
        <InlineAlert variant="warning">只读模式</InlineAlert>
      </>,
    );
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('暂无变更')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('正在加载工作区');
    expect(screen.getByText('只读模式')).toBeInTheDocument();
  });
});
