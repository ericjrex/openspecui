/**
 * @file 工作区轻量 Idea 弹窗组件
 * @description 支持创建、查看、编辑和删除工作区内的本地 Idea，可选关联具体仓库。
 * @author ypc
 */

import type { RepoBinding, WorkspaceIdea } from '@openspecui/shared';
import { Lightbulb, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '@/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { IdeaRepoSelect } from './workspace/IdeaRepoSelect';

interface IdeaModalProps {
  workspaceId: string;
  repos: RepoBinding[];
  idea?: WorkspaceIdea | null;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function IdeaModal({
  workspaceId,
  repos,
  idea,
  readOnly = false,
  onClose,
  onSaved,
}: IdeaModalProps) {
  const [repoId, setRepoId] = useState(idea?.repoId ?? '');
  const [title, setTitle] = useState(idea?.title ?? '');
  const [description, setDescription] = useState(idea?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);

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

  const handleDeleteCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    deleteButtonRef.current?.focus();
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!title.trim()) {
      setErrorMsg('请输入 Idea 标题');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      if (idea) {
        await api.updateIdea(workspaceId, idea.id, {
          repoId: repoId || null,
          title: title.trim(),
          description: description.trim(),
        });
      } else {
        await api.createIdea(workspaceId, {
          repoId: repoId || undefined,
          title: title.trim(),
          description: description.trim(),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!idea || readOnly) return;
    setSaving(true);
    try {
      await api.deleteIdea(workspaceId, idea.id);
      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-md bg-card text-foreground"
        showCloseButton={false}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader className="pr-14">
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb aria-hidden="true" className="text-warning" />
            {idea ? 'Idea 详情' : '记录新 Idea'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            记录或查看工作区 Idea，可选择关联仓库。
          </DialogDescription>
        </DialogHeader>

        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label="关闭 Idea 弹窗"
          >
            <X aria-hidden="true" />
          </Button>
        </DialogClose>

        <FieldGroup className="gap-4">
          <Field data-disabled={readOnly}>
            <FieldLabel htmlFor="idea-repo">关联仓库（可选）</FieldLabel>
            <IdeaRepoSelect
              id="idea-repo"
              repos={repos}
              value={repoId}
              onValueChange={setRepoId}
              disabled={readOnly}
            />
          </Field>

          <Field data-disabled={readOnly}>
            <FieldLabel htmlFor="idea-title">标题</FieldLabel>
            <Input
              id="idea-title"
              type="text"
              disabled={readOnly}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：支持一键导出静态规范文档"
            />
          </Field>

          <Field data-disabled={readOnly}>
            <FieldLabel htmlFor="idea-description">描述</FieldLabel>
            <Textarea
              id="idea-description"
              rows={4}
              disabled={readOnly}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="补充背景、约束或初步思路..."
            />
          </Field>

          {idea && (
            <p className="text-11 text-muted-foreground">
              创建时间：{new Date(idea.createdAt).toLocaleString()}
            </p>
          )}

          {errorMsg && (
            <Alert variant="destructive" className="border-destructive/40 bg-diff-removed">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>

        <DialogFooter className="sm:justify-between">
          <div>
            {idea && !readOnly && (
              <Button
                ref={deleteButtonRef}
                type="button"
                variant="destructive"
                size="sm"
                disabled={saving}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 data-icon="inline-start" aria-hidden="true" /> 删除
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">关闭</Button>
            </DialogClose>
            {!readOnly && (
              <Button
                type="button"
                size="sm"
                disabled={saving || !title.trim()}
                onClick={() => void handleSave()}
              >
                {saving && <Spinner data-icon="inline-start" aria-hidden="true" />}
                {saving ? '保存中...' : '保存 Idea'}
              </Button>
            )}
          </div>
        </DialogFooter>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent onCloseAutoFocus={handleDeleteCloseAutoFocus}>
            <AlertDialogHeader>
              <AlertDialogTitle>删除 Idea？</AlertDialogTitle>
              <AlertDialogDescription>
                删除后无法恢复，本地代码文件不会受到影响。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={saving}
                onClick={() => void handleDelete()}
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
