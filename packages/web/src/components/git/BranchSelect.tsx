import type { GitRepoStatus } from '@openspecui/shared';
import { GitBranch } from 'lucide-react';
import { Spinner } from '../ui/spinner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export const UNSELECTED_BRANCH_VALUE = '__unselected_branch__';

interface BranchSelectProps {
  repoName: string;
  status: GitRepoStatus;
  disabled: boolean;
  switching: boolean;
  onChange: (branch: string) => void;
}

export function BranchSelect({ repoName, status, disabled, switching, onChange }: BranchSelectProps) {
  const currentBranchExists = status.branches.includes(status.branch);
  const selectedValue = currentBranchExists ? status.branch : UNSELECTED_BRANCH_VALUE;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <GitBranch className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <Select
        value={selectedValue}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={`切换 ${repoName} 分支`}
          className="max-w-52 min-w-0 font-mono text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {!currentBranchExists && (
              <SelectItem value={UNSELECTED_BRANCH_VALUE} disabled>
                {status.branch || '未选择分支'}
              </SelectItem>
            )}
            {status.branches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {switching && (
        <span role="status" className="inline-flex items-center gap-1 text-xs text-primary">
          <Spinner aria-hidden="true" />
          切换中...
        </span>
      )}
    </div>
  );
}
