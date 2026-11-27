/**
 * @file 只读代码 Diff 查看器组件
 * @description 支持 Unified（统一）与 Split（左右对照）两种视图，展示未提交工作区或历史 Commit 的文件差异。
 * @author ypc
 */

import type { GitDiffResult } from '@openspecui/shared';
import { AlertTriangle, Columns2, FileCode2, Rows2 } from 'lucide-react';
import { useState } from 'react';
import { buildSplitRows } from '../lib/diff';
import { cn } from '../lib/utils';
import { Alert, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Spinner } from './ui/spinner';
import { Table, TableBody, TableCell, TableRow } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import {
  DIFF_STATUS_BADGE_CLASS_NAMES,
  getSplitDiffCellClassName,
  getUnifiedDiffLineClassName,
} from './diff/diffStyles';

interface DiffViewerProps {
  diff: GitDiffResult | null;
  loading?: boolean;
  title?: string;
}

export function DiffViewer({ diff, loading = false, title }: DiffViewerProps) {
  const [mode, setMode] = useState<'unified' | 'split'>('unified');

  if (loading) {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner aria-hidden="true" />
        正在加载代码 Diff...
      </div>
    );
  }

  if (!diff) {
    return (
      <Empty className="rounded-lg border border-dashed border-border bg-muted/30">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCode2 aria-hidden="true" />
          </EmptyMedia>
          <EmptyDescription>
            点击左侧的未提交工作区或任意 Commit 查看代码变更详情（只读）
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <FileCode2 aria-hidden="true" className="size-4 text-info" />
          <span className="truncate font-medium text-foreground">{title ?? diff.target}</span>
          <Badge variant="secondary">{diff.files.length} 个文件</Badge>
          {diff.truncated && (
            <Badge
              variant="outline"
              className="border-warning/30 bg-diff-modified text-warning"
            >
              文件数超上限，仅展示部分
            </Badge>
          )}
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value === 'unified' || value === 'split') {
              setMode(value);
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Diff 视图模式"
          className="bg-background"
        >
          <ToggleGroupItem value="unified" aria-label="Unified 视图">
            <Rows2 data-icon="inline-start" aria-hidden="true" />
            Unified
          </ToggleGroupItem>
          <ToggleGroupItem value="split" aria-label="Split 视图">
            <Columns2 data-icon="inline-start" aria-hidden="true" />
            Split
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {diff.files.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border bg-muted/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileCode2 aria-hidden="true" />
            </EmptyMedia>
            <EmptyDescription>当前目标没有可展示的文本差异</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        diff.files.map((file) => (
          <div
            key={file.path}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="flex items-center justify-between gap-3 bg-muted/40 px-3 py-1.5 text-xs">
              <span
                className="min-w-0 flex-1 truncate font-mono text-foreground-secondary"
                title={file.path}
              >
                {file.path}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('uppercase', DIFF_STATUS_BADGE_CLASS_NAMES[file.status])}
                >
                  {file.status}
                </Badge>
              </div>
            </div>
            <Separator />

            {file.truncated && (
              <Alert className="m-3 w-auto border-warning/30 bg-diff-modified text-warning">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>内容已截断</AlertTitle>
              </Alert>
            )}

            {mode === 'unified' || file.status === 'binary' ? (
              <ScrollArea
                type="scroll"
                role="region"
                className="max-h-96 w-full"
                aria-label={`${file.path} 统一差异`}
              >
                <div className="overflow-x-auto">
                  <pre className="w-max min-w-full p-3 text-xs leading-5">
                    {file.patch.split(/\r?\n/).map((line, index) => (
                      <span
                        key={index}
                        className={cn('block px-1', getUnifiedDiffLineClassName(line))}
                      >
                        {line || ' '}
                      </span>
                    ))}
                  </pre>
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea
                type="scroll"
                role="region"
                className="max-h-96 w-full"
                aria-label={`${file.path} 左右差异`}
              >
                <Table
                  className="w-full table-fixed border-collapse font-mono text-xs"
                  aria-label={`${file.path} 左右差异`}
                >
                  <TableBody>
                    {buildSplitRows(file.patch).map((row, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-border/60 hover:bg-transparent"
                      >
                        <TableCell
                          className={cn(
                            'w-1/2 whitespace-pre-wrap break-all px-2 py-0.5 align-top',
                            getSplitDiffCellClassName(row.leftType),
                          )}
                        >
                          {row.left ?? ''}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'w-1/2 whitespace-pre-wrap break-all border-l border-border px-2 py-0.5 align-top',
                            getSplitDiffCellClassName(row.rightType),
                          )}
                        >
                          {row.right ?? ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        ))
      )}
    </div>
  );
}
