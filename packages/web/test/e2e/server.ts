/**
 * @file 测试服务生命周期
 * @description 进程内启动真实 Fastify 工作台并安装 fetch 转发。
 *   测试描述文件禁止 spawn 子进程或自行解析服务地址。
 */
import { createWorkbenchServer } from '../../../server/src/server';
import { testConfig } from '../config';
import { allocTempDir } from './fixtures';

export type { WorkbenchServerInstance } from '../../../server/src/server';

export interface TestServer {
  instance: import('../../../server/src/server').WorkbenchServerInstance;
  baseUrl: string;
  cleanup: () => Promise<void>;
}

const nativeFetch = globalThis.fetch;

/**
 * 启动隔离的测试服务。`devMode` 为 true 时附带 Origin 头转发
 *（对应服务端 dev 模式的来源校验），其余场景保持无 Origin 转发。
 */
export async function startTestServer(options: { devMode?: boolean } = {}): Promise<TestServer> {
  const appHomeDir = allocTempDir('server-home-');
  const instance = await createWorkbenchServer({
    port: 0,
    host: testConfig.serverHost,
    ...(options.devMode ? { devMode: true as const } : {}),
    appHomeDir,
  });
  const baseUrl = `http://${testConfig.serverHost}:${instance.port}`;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = new URL(
      input instanceof URL ? input.href : typeof input === 'string' ? input : input.url,
      baseUrl,
    );
    if (!options.devMode) {
      if (input instanceof Request) {
        return nativeFetch(new Request(requestUrl, input), init);
      }
      return nativeFetch(requestUrl, init);
    }
    const headers = new Headers(init?.headers);
    headers.set('Origin', baseUrl);
    return nativeFetch(requestUrl, { ...init, headers });
  }) as typeof fetch;

  return {
    instance,
    baseUrl,
    cleanup: async () => {
      globalThis.fetch = nativeFetch;
      await instance.close();
    },
  };
}
