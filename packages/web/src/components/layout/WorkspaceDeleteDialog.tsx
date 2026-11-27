import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { Field, FieldLabel } from '../ui/field';

interface WorkspaceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  hasRemote: boolean;
  onConfirm: (cleanupCache: boolean) => void;
}

export function WorkspaceDeleteDialog({ open, onOpenChange, workspaceName, hasRemote, onConfirm }: WorkspaceDeleteDialogProps) {
  const [cleanupCache, setCleanupCache] = useState(false);

  useEffect(() => {
    if (!open) setCleanupCache(false);
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移除工作区「{workspaceName}」？</AlertDialogTitle>
          <AlertDialogDescription>本地代码文件不会被删除。</AlertDialogDescription>
        </AlertDialogHeader>
        {hasRemote && (
          <Field orientation="horizontal" data-disabled={false}>
            <Checkbox id="workspace-cleanup-cache" checked={cleanupCache} onCheckedChange={(checked) => setCleanupCache(checked === true)} />
            <FieldLabel htmlFor="workspace-cleanup-cache" className="font-normal">
              同时清理未被其他工作区引用的远程缓存仓库
            </FieldLabel>
          </Field>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => onConfirm(cleanupCache)}>
            确认移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
