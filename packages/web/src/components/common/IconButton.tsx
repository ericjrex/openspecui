import type { ComponentProps, ReactNode } from 'react';
import { Button } from '../ui/button';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'aria-label'> & {
  label: string;
  children: ReactNode;
};

export function IconButton({ label, children, ...props }: IconButtonProps) {
  return (
    <Button {...props} aria-label={label} title={label}>
      {children}
    </Button>
  );
}
