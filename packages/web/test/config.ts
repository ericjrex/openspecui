/**
 * @file 前端测试统一配置入口
 * @description 所有测试可调参数集中在此管理，经环境变量覆盖并提供 fallback。
 *   变量可在 `packages/web/.env` 中设置（见 `.env.example`），Vitest 会自动加载。
 *   测试文件内禁止出现字面超时、端口与视口数字，一律引用此处常量。
 */

/**
 * 浏览器模式（VRT）下不存在 process，必须先做存在性判断，
 * 缺失时一律使用 fallback，保证同一份配置可在 node/jsdom/browser 复用。
 */
function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  const raw = process.env[name];
  return raw === undefined || raw.trim() === '' ? undefined : raw;
}

function readNumber(name: string, fallback: number, allowZero = false): number {
  const raw = readEnv(name);
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || (!allowZero && parsed <= 0)) {
    return fallback;
  }
  return parsed;
}

function readString(name: string, fallback: string): string {
  return readEnv(name) ?? fallback;
}

export const testConfig = {
  /** 测试服务绑定地址 */
  serverHost: readString('OPENSPECUI_TEST_SERVER_HOST', '127.0.0.1'),
  /** 服务启动等待超时（beforeAll） */
  startupTimeoutMs: readNumber('OPENSPECUI_TEST_STARTUP_TIMEOUT_MS', 30_000),
  /** 单个用例超时（耗时交互场景） */
  caseTimeoutMs: readNumber('OPENSPECUI_TEST_CASE_TIMEOUT_MS', 30_000),
  /** Testing Library 查询等待超时（真实 git/API 往返场景默认 1 秒过紧） */
  findTimeoutMs: readNumber('OPENSPECUI_TEST_FIND_TIMEOUT_MS', 10_000),
  /** 临时目录名前缀 */
  tmpPrefix: readString('OPENSPECUI_TEST_TMP_PREFIX', 'openspecui-web-test-'),
  /** 可视化回归桌面视口宽度 */
  vrtDesktopWidth: readNumber('OPENSPECUI_TEST_VRT_DESKTOP_WIDTH', 1440),
  /** 可视化回归桌面视口高度 */
  vrtDesktopHeight: readNumber('OPENSPECUI_TEST_VRT_DESKTOP_HEIGHT', 900),
  /** 可视化回归移动视口宽度 */
  vrtMobileWidth: readNumber('OPENSPECUI_TEST_VRT_MOBILE_WIDTH', 390),
  /** 可视化回归移动视口高度 */
  vrtMobileHeight: readNumber('OPENSPECUI_TEST_VRT_MOBILE_HEIGHT', 844),
  /** 截图允许失配像素比例 */
  vrtMismatchedPixelRatio: readNumber('OPENSPECUI_TEST_VRT_MISMATCHED_PIXEL_RATIO', 0.01, true),
};
