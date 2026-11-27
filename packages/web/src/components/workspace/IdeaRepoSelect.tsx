import type { RepoBinding } from '@openspecui/shared';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NO_REPO_VALUE = '__workspace-idea-no-repo__';

interface IdeaRepoSelectProps {
  id: string;
  repos: RepoBinding[];
  value: string;
  onValueChange: (repoId: string) => void;
  disabled?: boolean;
}

export function IdeaRepoSelect({
  id,
  repos,
  value,
  onValueChange,
  disabled = false,
}: IdeaRepoSelectProps) {
  return (
    <Select
      value={value || NO_REPO_VALUE}
      onValueChange={(nextValue) => onValueChange(nextValue === NO_REPO_VALUE ? '' : nextValue)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full bg-input">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={NO_REPO_VALUE}>不限定仓库（工作区级灵感）</SelectItem>
          {repos.map((repo) => (
            <SelectItem key={repo.id} value={repo.id}>
              [{repo.role}] {repo.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
