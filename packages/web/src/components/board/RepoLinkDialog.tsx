import type { RepoBinding } from '@openspecui/shared';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '../ui/field';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

interface RepoLinkDialogProps {
  open: boolean;
  repos: RepoBinding[];
  title: string;
  selectedRepoIds: string[];
  error: string | null;
  repoColorMap: Map<string, string>;
  activeCountByRepo: Map<string, number>;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (title: string) => void;
  onToggleRepo: (repoId: string) => void;
  onCreate: () => void;
}

export function RepoLinkDialog({
  open,
  repos,
  title,
  selectedRepoIds,
  error,
  repoColorMap,
  activeCountByRepo,
  onOpenChange,
  onTitleChange,
  onToggleRepo,
  onCreate,
}: RepoLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>关联跨仓项目</DialogTitle>
          <DialogDescription>
            选择当前工作区中需要联动协作的 2 个及以上项目仓库；关联后将自动聚合进度并在 Change 的 Git 面板中联动展示。
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="repo-link-title">跨仓项目组名称</FieldLabel>
            <Input
              id="repo-link-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="例如：驾校系统（FE + BE）"
              aria-invalid={Boolean(error)}
            />
          </Field>
          <FieldSet>
            <FieldLegend>参与项目仓库</FieldLegend>
            <ScrollArea className="h-60 rounded-lg border bg-input/30 p-2">
              <div className="flex flex-col gap-1.5">
                {repos.map((repo) => {
                  const checked = selectedRepoIds.includes(repo.id);
                  return (
                    <label
                      key={repo.id}
                      htmlFor={`repo-link-${repo.id}`}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Checkbox
                          id={`repo-link-${repo.id}`}
                          checked={checked}
                          onCheckedChange={() => onToggleRepo(repo.id)}
                        />
                        <span
                          className={cn('size-2 shrink-0 rounded-full', repoColorMap.get(repo.id) ?? 'bg-repo-sky')}
                          aria-hidden="true"
                        />
                        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-info">
                          {repo.role}
                        </span>
                        <span className="truncate font-medium">{repo.name}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {activeCountByRepo.get(repo.id) ?? 0} active
                      </span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </FieldSet>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">取消</Button>
          </DialogClose>
          <Button type="button" onClick={onCreate}>保存项目关联</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
