import type { MainSpecEntry } from '@openspecui/shared';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MarkdownViewer } from '../MarkdownViewer';
import { SpecHistoryPanel } from '../SpecHistoryPanel';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface SpecsViewProps {
  specs: MainSpecEntry[];
  selectedSpec: MainSpecEntry | null;
  onSelectSpec: (spec: MainSpecEntry) => void;
}

export function SpecsView({ specs, selectedSpec, onSelectSpec }: SpecsViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="gap-1.5 p-3">
        {specs.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyTitle>暂无主规范</EmptyTitle>
              <EmptyDescription>openspec/specs/</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          specs.map((spec) => {
            const active = selectedSpec?.repoId === spec.repoId
              && selectedSpec?.capabilityPath === spec.capabilityPath;
            return (
              <Button
                key={`${spec.repoId}:${spec.capabilityPath}`}
                type="button"
                variant="ghost"
                aria-pressed={active}
                onClick={() => onSelectSpec(spec)}
                className={cn(
                  'h-auto w-full flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal',
                  active && 'bg-info/10 text-info ring-1 ring-info/40',
                )}
              >
                <span className="flex w-full min-w-0 items-center gap-1.5">
                  <Badge variant="secondary" className="px-1.5 text-[10px]">{spec.repoRole}</Badge>
                  <span className="truncate font-mono text-xs font-medium">{spec.capabilityPath}</span>
                </span>
                <span className="flex w-full items-center justify-between gap-2 text-[11px] font-normal text-muted-foreground">
                  <span className="truncate">{spec.repoName}</span>
                  <span className="shrink-0">{spec.requirementCount} 条</span>
                </span>
              </Button>
            );
          })
        )}
      </Card>

      <Card className="gap-3 p-4 lg:col-span-3">
        {selectedSpec ? (
          <>
            <CardHeader className="gap-3 border-b pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex min-w-0 items-center gap-2 font-mono text-sm">
                  <BookOpen className="size-4 shrink-0 text-info" />
                  <span className="truncate">[{selectedSpec.repoRole}] {selectedSpec.capabilityPath}</span>
                </CardTitle>
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  <CheckCircle2 data-icon="inline-start" /> {selectedSpec.requirementCount} Requirements
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-0">
              <SpecHistoryPanel
                key={`${selectedSpec.repoId}:${selectedSpec.capabilityPath}`}
                repoId={selectedSpec.repoId}
                capabilityPath={selectedSpec.capabilityPath}
              />
              <Separator />
              <ScrollArea className="h-[70vh]">
                <MarkdownViewer
                  content={selectedSpec.rawContent}
                  title={`openspec/specs/${selectedSpec.capabilityPath}/spec.md`}
                />
              </ScrollArea>
            </CardContent>
          </>
        ) : (
          <Empty className="border-0 p-8">
            <EmptyHeader>
              <EmptyTitle>选择左侧能力规范查看详情</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </Card>
    </div>
  );
}
