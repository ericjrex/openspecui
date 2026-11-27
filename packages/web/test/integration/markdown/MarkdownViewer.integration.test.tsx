import type { TaskItem } from '@openspecui/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MarkdownViewer } from '@/components/MarkdownViewer';

const taskContent = [
  '# 任务',
  '',
  '```md',
  '- [ ] 示例',
  '```',
  '',
  '- [ ] 实际任务',
  '',
].join('\n');

function createTask(): TaskItem {
  return {
    lineNumber: 7,
    section: '任务',
    text: '实际任务',
    checked: false,
    rawLine: '- [ ] 实际任务',
  };
}

describe('MarkdownViewer', () => {
  it('renders GFM tables with shadcn table primitives and switches source view', async () => {
    const content = [
      '# 文档',
      '',
      '| 名称 | 状态 |',
      '| --- | --- |',
      '| 渲染 | 完成 |',
      '',
      '<img id="unsafe" src="invalid" onerror="alert(1)">',
    ].join('\n');
    const { container } = render(<MarkdownViewer content={content} title="spec.md" />);

    expect(screen.getByRole('heading', { name: '文档', level: 1 })).toHaveAttribute('id', '文档');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '名称' })).toHaveAttribute(
      'data-slot',
      'table-head',
    );
    expect(screen.getByRole('cell', { name: '完成' })).toHaveAttribute('data-slot', 'table-cell');
    expect(container.querySelector('img')).toBeNull();

    await userEvent.click(screen.getByRole('radio', { name: '源码视图' }));

    expect(screen.getByLabelText('Markdown 源码')).toHaveTextContent('| 名称 | 状态 |');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: '渲染视图' }));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByLabelText('Markdown 源码')).not.toBeInTheDocument();
  });

  it('maps the task checkbox through the Markdown AST line number and writes back the matched task', async () => {
    const task = createTask();
    const toggled: TaskItem[] = [];
    const { container } = render(
      <MarkdownViewer
        content={taskContent}
        taskToggle={{
          items: [task],
          onToggle: (item) => toggled.push(item),
        }}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: '实际任务' });
    expect(container.querySelectorAll('[data-slot="checkbox"]')).toHaveLength(1);
    expect(checkbox.closest('li')).toHaveAttribute('data-line-number', '7');
    expect(checkbox).toBeEnabled();
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(toggled).toEqual([task]);
  });

  it('keeps read-only and in-flight task checkboxes disabled', async () => {
    const task = createTask();
    const toggled: TaskItem[] = [];
    const { rerender } = render(
      <MarkdownViewer
        content={taskContent}
        taskToggle={{
          items: [task],
          disabled: true,
          onToggle: (item) => toggled.push(item),
        }}
      />,
    );

    const readOnlyCheckbox = screen.getByRole('checkbox', { name: '实际任务' });
    expect(readOnlyCheckbox).toBeDisabled();
    expect(readOnlyCheckbox).toHaveAttribute('title', '只读状态不可修改');

    await userEvent.click(readOnlyCheckbox);
    expect(toggled).toEqual([]);

    rerender(
      <MarkdownViewer
        content={taskContent}
        taskToggle={{
          items: [task],
          togglingLineNumber: task.lineNumber,
          onToggle: (item) => toggled.push(item),
        }}
      />,
    );

    const pendingCheckbox = screen.getByRole('checkbox', { name: '实际任务' });
    expect(pendingCheckbox).toBeDisabled();
    expect(pendingCheckbox).toHaveAttribute('aria-busy', 'true');
    expect(pendingCheckbox).toHaveAttribute('title', '正在更新任务状态');
  });

  it('renders task checkboxes as disabled when task writeback is unavailable', () => {
    render(<MarkdownViewer content={'- [x] 已完成任务'} />);

    const checkbox = screen.getByRole('checkbox', { name: '只读任务复选框' });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute('title', '已完成（只读）');
  });

  it('creates unique prefixed heading IDs and moves focus to the local anchor target', async () => {
    const content = '# Shared\n\n[跳转](#shared)';
    render(
      <>
        <MarkdownViewer content={content} idPrefix="left-" />
        <MarkdownViewer content={content} idPrefix="right-" />
      </>,
    );

    const [leftHeading, rightHeading] = screen.getAllByRole('heading', { name: 'Shared' });
    const [leftLink, rightLink] = screen.getAllByRole('link', { name: '跳转' });

    expect(leftHeading).toHaveAttribute('id', 'left-shared');
    expect(rightHeading).toHaveAttribute('id', 'right-shared');
    expect(leftHeading).toHaveAttribute('tabindex', '-1');
    expect(leftLink).toHaveAttribute('href', '#left-shared');
    expect(rightLink).toHaveAttribute('href', '#right-shared');

    await userEvent.click(leftLink);
    expect(leftHeading).toHaveFocus();
    expect(rightHeading).not.toHaveFocus();

    await userEvent.click(rightLink);
    expect(rightHeading).toHaveFocus();
    expect(leftHeading).not.toHaveFocus();
  });

  it('applies the prefix when a heading slug already starts with the same text', async () => {
    render(
      <MarkdownViewer
        content={'# Spec Overview\n\n[跳转](#spec-overview)'}
        idPrefix="spec-"
      />,
    );

    const heading = screen.getByRole('heading', { name: 'Spec Overview' });
    const link = screen.getByRole('link', { name: '跳转' });
    expect(heading).toHaveAttribute('id', 'spec-spec-overview');
    expect(link).toHaveAttribute('href', '#spec-spec-overview');

    await userEvent.click(link);
    expect(heading).toHaveFocus();
  });

  it('preserves unprefixed heading IDs by default', () => {
    render(<MarkdownViewer content={'# Shared\n\n[跳转](#shared)'} />);

    expect(screen.getByRole('heading', { name: 'Shared' })).toHaveAttribute('id', 'shared');
    expect(screen.getByRole('link', { name: '跳转' })).toHaveAttribute('href', '#shared');
  });

  it('delegates relative document links and keeps external links safe', async () => {
    const navigated: string[] = [];
    render(
      <MarkdownViewer
        content={'[设计](design.md)\n\n[外部](https://example.com/docs)'}
        onNavigateLink={(href) => {
          navigated.push(href);
        }}
      />,
    );

    await userEvent.click(screen.getByRole('link', { name: '设计' }));
    expect(navigated).toEqual(['design.md']);

    const externalLink = screen.getByRole('link', { name: '外部' });
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('starts in source view when defaultRaw is enabled', () => {
    render(<MarkdownViewer content="# 源码标题" defaultRaw />);

    expect(screen.getByLabelText('Markdown 源码')).toHaveTextContent('# 源码标题');
    expect(screen.queryByRole('heading', { name: '源码标题' })).not.toBeInTheDocument();
  });
});
