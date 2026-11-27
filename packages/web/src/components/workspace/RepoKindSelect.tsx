import type { RepoKind } from '@openspecui/shared';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RepoKindSelectProps {
  id: string;
  value: RepoKind;
  onValueChange: (value: RepoKind) => void;
  remote?: boolean;
  disabled?: boolean;
}

export function RepoKindSelect({
  id,
  value,
  onValueChange,
  remote = false,
  disabled = false,
}: RepoKindSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as RepoKind)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full bg-input text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="hybrid">代码 + OpenSpec</SelectItem>
          {remote ? (
            <SelectItem value="store">远程 Store 仓</SelectItem>
          ) : (
            <SelectItem value="code">纯代码仓</SelectItem>
          )}
          {remote ? (
            <SelectItem value="code">纯代码仓</SelectItem>
          ) : (
            <SelectItem value="store">独立 Store 仓</SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
