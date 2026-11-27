import { Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface MobileAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnlyMode: boolean;
  lanUrls: string[];
}

export function MobileAccessDialog({ open, onOpenChange, readOnlyMode, lanUrls }: MobileAccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone aria-hidden="true" className="size-4 text-info" />
            在手机 / 局域网打开看板
          </DialogTitle>
          <DialogDescription>查看局域网访问地址与只读保护说明。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs text-muted-foreground">
          {readOnlyMode && lanUrls.length > 0 ? (
            <>
              <p>当前服务已在局域网只读模式运行，同 Wi-Fi 下手机浏览器可访问：</p>
              <div className="space-y-1.5">
                {lanUrls.map((url) => (
                  <div key={url} className="rounded-lg border border-border bg-input px-3 py-2 font-mono text-info">
                    {url}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>
                默认启动仅监听本机 <code className="rounded bg-secondary px-1">127.0.0.1</code> 以保护本地写权限。如需手机同局域网查看，请使用以下命令启动（自动锁定为只读模式）：
              </p>
              <pre className="rounded-lg border border-border bg-input p-3 font-mono text-11 text-info">openspecui --host 0.0.0.0</pre>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
