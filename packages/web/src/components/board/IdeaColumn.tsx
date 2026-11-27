import type { RepoBinding, WorkspaceIdea } from '@openspecui/shared';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lightbulb, Pencil, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty';
import { SortableDragHandle } from './SortableDragHandle';
import type { DragItemData } from './types';

interface IdeaCardProps {
  idea: WorkspaceIdea;
  repo?: RepoBinding;
  readOnlyMode: boolean;
  onOpenIdeaModal: (idea?: WorkspaceIdea | null) => void;
}

function IdeaCard({ idea, repo, readOnlyMode, onOpenIdeaModal }: IdeaCardProps) {
  const data: DragItemData = { kind: 'idea', persistId: idea.id, label: idea.title };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: `idea:${idea.id}`, data, disabled: readOnlyMode });

  return (
    <Card
      ref={setNodeRef}
      size="sm"
      className={cn('gap-2', isDragging && 'opacity-50', isOver && 'ring-2 ring-warning/50')}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CardHeader className="gap-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
            <Lightbulb data-icon="inline-start" /> Idea
          </Badge>
          <span className="text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString()}</span>
        </div>
        <CardTitle className="text-xs">{idea.title}</CardTitle>
        {idea.description && <CardDescription className="line-clamp-2 text-[11px]">{idea.description}</CardDescription>}
        <CardAction>
          <SortableDragHandle
            label={`拖动排序 Idea：${idea.title}`}
            disabled={readOnlyMode}
            listeners={listeners}
            attributes={attributes}
            setActivatorNodeRef={setActivatorNodeRef}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {repo && <Badge variant="secondary" className="text-[10px]">Linked: {repo.name}</Badge>}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={`编辑 Idea：${idea.title}`}
          onClick={() => onOpenIdeaModal(idea)}
        >
          <Pencil data-icon="inline-start" /> 编辑 Idea
        </Button>
      </CardFooter>
    </Card>
  );
}

interface IdeaColumnProps {
  ideas: WorkspaceIdea[];
  repos: RepoBinding[];
  expanded: boolean;
  readOnlyMode: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onOpenIdeaModal: (idea?: WorkspaceIdea | null) => void;
}

export function IdeaColumn({
  ideas,
  repos,
  expanded,
  readOnlyMode,
  onExpandedChange,
  onOpenIdeaModal,
}: IdeaColumnProps) {
  if (!expanded) {
    return (
      <Button
        type="button"
        variant="outline"
        aria-label="展开 Ideas 列"
        onClick={() => onExpandedChange(true)}
        className="h-auto w-11 shrink-0 flex-col gap-3 px-2 py-4 text-warning"
      >
        <Lightbulb data-icon="inline-start" />
        <span className="font-semibold">{ideas.length}</span>
        <span className="text-[11px] [writing-mode:vertical-rl] text-muted-foreground">Ideas</span>
      </Button>
    );
  }

  return (
    <Card className="w-72 shrink-0 gap-3 border-warning/30 bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="收起 Ideas 列"
          onClick={() => onExpandedChange(false)}
          className="px-1 text-warning"
        >
          <Lightbulb data-icon="inline-start" /> Ideas ({ideas.length})
        </Button>
        {!readOnlyMode && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="新建 Idea"
            title="New idea"
            onClick={() => onOpenIdeaModal(null)}
          >
            <Plus data-icon="inline-start" />
          </Button>
        )}
      </div>
      <SortableContext items={ideas.map((idea) => `idea:${idea.id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {ideas.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>暂无 Idea</EmptyTitle>
                <EmptyDescription>点击上方 + 记录想法</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                repo={repos.find((repo) => repo.id === idea.repoId)}
                readOnlyMode={readOnlyMode}
                onOpenIdeaModal={onOpenIdeaModal}
              />
            ))
          )}
        </div>
      </SortableContext>
    </Card>
  );
}
