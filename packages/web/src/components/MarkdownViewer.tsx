/**
 * @file 安全 Markdown 渲染组件
 * @description 使用 react-markdown + remark-gfm 渲染 Proposal、Design 与 Spec 文档，支持 GFM、任务回写和源码切换。
 * @author ypc
 */

import type { TaskItem } from '@openspecui/shared';
import { Code2, Eye } from 'lucide-react';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Table, TableCell, TableHead } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

export interface MarkdownTaskToggleOptions {
  items: TaskItem[];
  disabled?: boolean;
  togglingLineNumber?: number | null;
  onToggle: (item: TaskItem) => void;
}

interface MarkdownViewerProps {
  content: string;
  title?: string;
  defaultRaw?: boolean;
  /** 顶栏左侧或中部附加信息徽标（例如任务进度、只读状态提示） */
  headerExtra?: ReactNode;
  /** 可选：启用 GFM 任务列表交互勾选回写 */
  taskToggle?: MarkdownTaskToggleOptions;
  /** 可选：拦截文档内相对超链接点击，返回 true 表示已由宿主容器接管导航 */
  onNavigateLink?: (href: string) => boolean | void;
  /** 可选：为标题 ID 添加前缀，避免并排文档出现重复 ID */
  idPrefix?: string;
}

/**
 * 递归提取 React 节点中的纯文本，用于生成与 GitHub/Markdown 一致的标题锚点
 */
function extractNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractNodeText).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }
  return Children.toArray(node).map(extractNodeText).join('');
}

/**
 * 将标题文本转换为稳定 URL 锚点 slug（保留中文、英文、数字与连字符）
 */
export function headingTextToSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u0000-\u002c\u002e\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u007f]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function getHeadingId(text: string, idPrefix: string): string | undefined {
  const slug = headingTextToSlug(text);
  return slug ? `${idPrefix}${slug}` : undefined;
}

function prefixHashTarget(target: string, idPrefix: string): string {
  return idPrefix && target ? `${idPrefix}${target}` : target;
}

function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href.trim());
}

const TaskLineNumberContext = createContext<number | undefined>(undefined);

interface MarkdownTaskCheckboxProps {
  checked: boolean;
  taskByLine: Map<number, TaskItem>;
  taskToggle?: MarkdownTaskToggleOptions;
}

function MarkdownTaskCheckbox({ checked, taskByLine, taskToggle }: MarkdownTaskCheckboxProps) {
  const lineNumber = useContext(TaskLineNumberContext);
  const matchedItem = lineNumber === undefined ? undefined : taskByLine.get(lineNumber);
  const isChecked = matchedItem ? matchedItem.checked : checked;
  const isToggling = Boolean(
    taskToggle && lineNumber !== undefined && taskToggle.togglingLineNumber === lineNumber,
  );
  const isDisabled = !taskToggle || !matchedItem || Boolean(taskToggle.disabled) || isToggling;
  const checkboxTitle = isToggling
    ? '正在更新任务状态'
    : isDisabled
      ? isChecked
        ? '已完成（只读）'
        : '只读状态不可修改'
      : isChecked
        ? '点击标记为未完成'
        : '点击标记为已完成';

  return (
    <Checkbox
      checked={isChecked}
      disabled={isDisabled}
      aria-label={matchedItem?.text || '只读任务复选框'}
      aria-busy={isToggling || undefined}
      title={checkboxTitle}
      onCheckedChange={() => {
        if (matchedItem && taskToggle && !isDisabled) {
          taskToggle.onToggle(matchedItem);
        }
      }}
      className={cn('absolute left-0 top-[6px]', isToggling && 'animate-pulse')}
    />
  );
}

export function MarkdownViewer({
  content,
  title,
  defaultRaw = false,
  headerExtra,
  taskToggle,
  onNavigateLink,
  idPrefix = '',
}: MarkdownViewerProps) {
  const [showRaw, setShowRaw] = useState(defaultRaw);
  const containerRef = useRef<HTMLDivElement>(null);

  const taskByLine = useMemo(() => {
    const map = new Map<number, TaskItem>();
    if (taskToggle) {
      for (const item of taskToggle.items) {
        map.set(item.lineNumber, item);
      }
    }
    return map;
  }, [taskToggle]);

  const scrollToLocalHash = (hash: string) => {
    const rawTarget = hash.replace(/^#/, '').trim();
    if (!rawTarget) return false;

    let decoded = rawTarget;
    try {
      decoded = decodeURIComponent(rawTarget);
    } catch {
      // 保留原始字符串匹配
    }

    const root = containerRef.current;
    if (!root) return false;

    const expectedIds = new Set(
      [rawTarget, decoded, headingTextToSlug(decoded)]
        .filter(Boolean)
        .map((target) => prefixHashTarget(target, idPrefix)),
    );
    const candidates = root.querySelectorAll<HTMLElement>('[id]');

    for (const element of candidates) {
      if (!expectedIds.has(element.id)) continue;

      element.focus({ preventScroll: true });
      element.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return true;
    }

    return false;
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-4 py-2 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-mono text-muted-foreground">{title ?? 'Markdown'}</span>
          {headerExtra}
        </div>
        <ToggleGroup
          type="single"
          value={showRaw ? 'raw' : 'rendered'}
          onValueChange={(value) => {
            if (value === 'rendered' || value === 'raw') {
              setShowRaw(value === 'raw');
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Markdown 视图模式"
          className="shrink-0 bg-background"
        >
          <ToggleGroupItem value="rendered" aria-label="渲染视图">
            <Eye data-icon="inline-start" aria-hidden="true" />
            渲染
          </ToggleGroupItem>
          <ToggleGroupItem value="raw" aria-label="源码视图">
            <Code2 data-icon="inline-start" aria-hidden="true" />
            源码
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Separator />

      {showRaw ? (
        <pre
          aria-label="Markdown 源码"
          className="overflow-auto whitespace-pre-wrap p-5 text-xs leading-6 text-foreground-muted"
        >
          {content}
        </pre>
      ) : (
        <div className="p-5 text-sm leading-7 text-foreground-secondary">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => {
                const id = getHeadingId(extractNodeText(children), idPrefix);
                return (
                  <h1
                    id={id}
                    tabIndex={id ? -1 : undefined}
                    className="mb-4 scroll-mt-4 rounded-sm border-b border-border pb-2 text-xl font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {children}
                  </h1>
                );
              },
              h2: ({ children }) => {
                const id = getHeadingId(extractNodeText(children), idPrefix);
                return (
                  <h2
                    id={id}
                    tabIndex={id ? -1 : undefined}
                    className="mb-3 mt-6 scroll-mt-4 rounded-sm border-b border-border pb-1.5 text-base font-semibold text-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const id = getHeadingId(extractNodeText(children), idPrefix);
                return (
                  <h3
                    id={id}
                    tabIndex={id ? -1 : undefined}
                    className="mb-2 mt-4 scroll-mt-4 rounded-sm text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {children}
                  </h3>
                );
              },
              h4: ({ children }) => {
                const id = getHeadingId(extractNodeText(children), idPrefix);
                return (
                  <h4
                    id={id}
                    tabIndex={id ? -1 : undefined}
                    className="mb-1.5 mt-3 scroll-mt-4 rounded-sm text-xs font-semibold uppercase tracking-wide text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {children}
                  </h4>
                );
              },
              p: ({ children }) => <p className="mb-3 text-foreground-muted">{children}</p>,
              ul: ({ className, children }) => {
                const isTaskList = className?.includes('contains-task-list');
                return (
                  <ul
                    className={
                      isTaskList
                        ? 'mb-3 flex list-none flex-col gap-1.5 pl-0 text-foreground-secondary'
                        : 'mb-3 flex list-disc flex-col gap-1 pl-5 text-foreground-muted'
                    }
                  >
                    {children}
                  </ul>
                );
              },
              ol: ({ children }) => (
                <ol className="mb-3 flex list-decimal flex-col gap-1 pl-5 text-foreground-muted">
                  {children}
                </ol>
              ),
              li: ({ className, children, node }) => {
                const isTaskItem = className?.includes('task-list-item');
                const lineNumber = node?.position?.start?.line;
                return (
                  <TaskLineNumberContext.Provider value={lineNumber}>
                    <li
                      className={isTaskItem ? 'relative list-none pl-6 leading-7' : 'leading-6'}
                      data-line-number={isTaskItem ? lineNumber : undefined}
                    >
                      {children}
                    </li>
                  </TaskLineNumberContext.Provider>
                );
              },
              input: ({ type, checked }) => {
                if (type !== 'checkbox') {
                  return <input type={type} checked={checked} readOnly />;
                }

                return (
                  <MarkdownTaskCheckbox
                    checked={Boolean(checked)}
                    taskByLine={taskByLine}
                    taskToggle={taskToggle}
                  />
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-2 border-info bg-diff-info px-3 py-1.5 text-foreground-muted">
                  {children}
                </blockquote>
              ),
              code: ({ className, children }) => {
                const isBlock = Boolean(className);
                if (isBlock) {
                  return (
                    <code className="block overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5 text-foreground-secondary">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-info">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <pre className="my-3 overflow-x-auto">{children}</pre>,
              table: ({ children }) => (
                <div className="my-3 overflow-hidden rounded-lg border border-border">
                  <Table className="w-full border-collapse text-left text-xs">{children}</Table>
                </div>
              ),
              th: ({ children }) => (
                <TableHead className="border-b border-border bg-muted px-3 py-2 font-semibold text-foreground">
                  {children}
                </TableHead>
              ),
              td: ({ children }) => (
                <TableCell className="whitespace-normal border-b border-border px-3 py-2 text-foreground-muted">
                  {children}
                </TableCell>
              ),
              a: ({ href, children }) => {
                const rawHref = (href ?? '').trim();
                const external = isExternalHref(rawHref);
                const localHref = rawHref.startsWith('#')
                  ? `#${prefixHashTarget(rawHref.slice(1), idPrefix)}`
                  : href;

                return (
                  <a
                    href={localHref}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    title={external ? rawHref : `文档内链接: ${rawHref}`}
                    onClick={(event) => {
                      if (external || !rawHref) return;

                      event.preventDefault();
                      if (rawHref.startsWith('#')) {
                        scrollToLocalHash(rawHref);
                        return;
                      }

                      onNavigateLink?.(rawHref);
                    }}
                    className="cursor-pointer text-info underline decoration-info/40 underline-offset-2 hover:text-primary"
                  >
                    {children}
                  </a>
                );
              },
              hr: () => <Separator className="my-4" />,
            }}
          >
            {content}
          </Markdown>
        </div>
      )}
    </div>
  );
}
