import type { RepoBinding } from '@openspecui/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface UnbindRepoDialogProps {
  repo: RepoBinding;
  pending: boolean;
  onConfirm: (cleanupCache: boolean) => Promise<void>;
}

export function UnbindRepoDialog({ repo, pending, onConfirm }: UnbindRepoDialogProps) {
  const [open, setOpen] = useState(false);
  const isRemote = repo.sourceType === 'remote';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`解绑仓库 ${repo.name}`}
          title="从当前工作区解绑此仓库"
          disabled={pending}
        >
          <Trash2 data-icon="inline-start" aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isRemote ? '解绑远程缓存仓库？' : '解绑仓库？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRemote
              ? `将从当前工作区解绑“${repo.name}”。可以保留本地缓存，也可以解绑后立即清理缓存目录。`
              : `将从当前工作区解绑“${repo.name}”，本地仓库文件不会被删除。`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>取消</AlertDialogCancel>
          {isRemote ? (
            <>
              <AlertDialogAction
                variant="outline"
                disabled={pending}
                onClick={() => void onConfirm(false)}
              >
                仅解绑
              </AlertDialogAction>
              <AlertDialogAction
                variant="destructive"
                disabled={pending}
                onClick={() => void onConfirm(true)}
              >
                解绑并清理缓存
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void onConfirm(false)}
            >
              确认解绑
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
