/**
 * @file 本机文件夹浏览选择器弹窗组件
 * @description 通过只读服务端目录枚举接口浏览本机盘符与子目录，带 OpenSpec/Git 标记并回填选中绝对路径。
 * @author ypc
 */

import type { DirectoryBrowseResult } from '@openspecui/shared';
import { ArrowUp, Check, Folder, HardDrive, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LocalFolderPickerModalProps {
  initialPath?: string;
  onSelect: (selectedPath: string) => void;
  onClose: () => void;
}

export function LocalFolderPickerModal({
  initialPath,
  onSelect,
  onClose,
}: LocalFolderPickerModalProps) {
  const [data, setData] = useState<DirectoryBrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const returnFocusTarget = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  const handleCloseAutoFocus = (event: Event) => {
    const target = returnFocusTarget.current;
    if (target?.isConnected && target !== document.body) {
      event.preventDefault();
      target.focus();
    }
  };

  const navigateTo = async (targetPath?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.browseDirs(targetPath);
      setData(response);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void navigateTo(initialPath?.trim() || undefined);
  }, [initialPath]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col gap-0 overflow-hidden bg-card p-0 text-foreground"
        showCloseButton={false}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader className="shrink-0 px-4 py-3 pr-14">
          <DialogTitle className="flex items-center gap-2">
            <Folder aria-hidden="true" className="text-info" />
            浏览本机文件夹
          </DialogTitle>
          <DialogDescription className="sr-only">
            点击文件夹名进入下级，点击右侧“选中”直接填入。
          </DialogDescription>
        </DialogHeader>

        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label="关闭目录选择弹窗"
          >
            <X aria-hidden="true" />
          </Button>
        </DialogClose>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4 text-xs">
          {data && data.roots.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground">磁盘：</span>
              {data.roots.map((root) => (
                <Button
                  key={root}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => void navigateTo(root)}
                  className="font-mono"
                >
                  <HardDrive data-icon="inline-start" aria-hidden="true" />
                  {root}
                </Button>
              ))}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="folder-picker-current-path" className="sr-only">
              当前目录
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!data?.parentPath || loading}
                onClick={() => data?.parentPath && void navigateTo(data.parentPath)}
              >
                <ArrowUp data-icon="inline-start" aria-hidden="true" /> 上一级
              </Button>
              <Input
                id="folder-picker-current-path"
                readOnly
                value={data?.currentPath ?? '本机磁盘列表'}
                className="flex-1 border-border bg-input font-mono text-foreground-secondary"
              />
            </div>
          </Field>

          {errorMsg && (
            <Alert variant="destructive" className="border-destructive/40 bg-diff-removed">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-64 shrink-0 rounded-lg border border-border bg-input p-1.5">
            {loading ? (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>正在读取目录...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : !data || data.entries.length === 0 ? (
              <Empty className="border border-dashed border-border p-6">
                <EmptyHeader>
                  <EmptyTitle>当前目录下没有子文件夹</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-1">
                {data.entries.map((entry) => (
                  <div
                    key={entry.path}
                    className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 hover:bg-muted"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void navigateTo(entry.path)}
                      className="min-w-0 flex-1 justify-start px-0 text-left font-normal"
                    >
                      <Folder
                        aria-hidden="true"
                        className={cn('shrink-0', entry.hasOpenSpec ? 'text-success' : 'text-info')}
                      />
                      <span className="truncate text-foreground">{entry.name}</span>
                      {entry.hasOpenSpec && (
                        <Badge variant="secondary" className="text-success">OpenSpec</Badge>
                      )}
                      {entry.hasGit && (
                        <Badge variant="secondary" className="text-info">Git</Badge>
                      )}
                    </Button>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => onSelect(entry.path)}
                      >
                        选中
                      </Button>
                    </DialogClose>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 px-4 py-3 sm:justify-between">
          <span className="text-11 text-muted-foreground">
            提示：点击文件夹名进入下级，点击右侧“选中”直接填入
          </span>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">取消</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                type="button"
                size="sm"
                disabled={!data?.currentPath}
                onClick={() => {
                  if (data?.currentPath) onSelect(data.currentPath);
                }}
              >
                <Check data-icon="inline-start" aria-hidden="true" /> 选择当前目录
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
