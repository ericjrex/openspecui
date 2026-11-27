/**
 * @file integration 项目全局 setup
 * @description 安装 jsdom 缺失的 DOM 能力垫片。各测试文件不得重复定义这些垫片。
 */

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as typeof ResizeObserver;
}

if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = MouseEvent as typeof PointerEvent;
}

for (const prototype of [HTMLElement.prototype, SVGElement.prototype]) {
  if (!Object.getOwnPropertyDescriptor(prototype, 'scrollIntoView')) {
    Object.defineProperty(prototype, 'scrollIntoView', {
      configurable: true,
      value: () => undefined,
    });
  }
}

for (const method of ['hasPointerCapture', 'setPointerCapture', 'releasePointerCapture'] as const) {
  if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, method)) {
    Object.defineProperty(HTMLElement.prototype, method, {
      configurable: true,
      value: method === 'hasPointerCapture' ? () => false : () => undefined,
    });
  }
}
