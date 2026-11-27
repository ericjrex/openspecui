import { Lock } from 'lucide-react';

export function ReadOnlyBanner() {
  return (
    <div className="border-b border-warning/30 bg-warning/15 px-4 py-1.5 text-center text-xs text-warning" role="status">
      <span className="inline-flex items-center gap-1.5">
        <Lock aria-hidden="true" className="size-3.5" />
        当前通过局域网（--host 0.0.0.0）以只读模式运行：所有写入、回写与本机目录控制接口已安全锁定
      </span>
    </div>
  );
}
