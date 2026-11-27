/**
 * @file 测试 fixture（临时目录、工作区、远程缓存）
 * @description 集中管理测试对本机的读写。测试描述文件只消费返回的数据，
 *   不得直接调用 node:fs / node:os 创建或清理目录。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { testConfig } from '../config';
import { runGit } from './git';
import type { WorkbenchServerInstance } from './server';

const tempDirs: string[] = [];

/** 分配带前缀的临时目录并登记清理。 */
export function allocTempDir(prefix: string): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `${testConfig.tmpPrefix}${prefix}`));
  tempDirs.push(directory);
  return directory;
}

/** 在父目录下创建普通子目录（含 openspec/ 骨架的可选变体）。 */
export function makeDir(parent: string, name: string, withOpenSpec = false): string {
  const directory = path.join(parent, name);
  fs.mkdirSync(withOpenSpec ? path.join(directory, 'openspec') : directory, { recursive: true });
  return directory;
}

/** 写入文本文件（自动创建父目录）。 */
export function writeTextFile(directory: string, relativePath: string, content: string): void {
  const filePath = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

/** 读取文本文件。 */
export function readTextFile(directory: string, relativePath: string): string {
  return fs.readFileSync(path.join(directory, relativePath), 'utf8');
}

/** 判断绝对路径是否存在。 */
export function pathExists(absolutePath: string): boolean {
  return fs.existsSync(absolutePath);
}

/** 取目录的显示名（跨平台）。 */
export function displayNameOf(directory: string): string {
  return path.basename(directory);
}

/** 清理本文件分配的全部临时目录。 */
export function cleanupTempDirs(): void {
  while (tempDirs.length > 0) {
    const directory = tempDirs.pop();
    if (directory) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
}

export interface LocalRepoSpec {
  directory: string;
  role: string;
  name?: string;
}

/** 经真实 API 创建绑定本地仓库的工作区。 */
export async function createLocalWorkspace(
  api: typeof import('../../src/api').api,
  name: string,
  repositories: LocalRepoSpec[],
) {
  return api.createWorkspace({
    name,
    repos: repositories.map(({ directory, role, name: repoName }) => ({
      sourceType: 'local' as const,
      localPath: directory,
      ...(repoName === undefined ? {} : { name: repoName }),
      role,
      kind: 'hybrid' as const,
    })),
  });
}

export interface RemoteCacheSpec {
  repo: unknown;
  cacheDirectory: string;
}

/**
 * 以受控 clone 方式为工作区挂载远程只读缓存仓（来源为本机 git 目录）。
 * 仅用于测试远程缓存分支逻辑，不访问外部网络。
 */
export async function addRemoteCache(
  server: WorkbenchServerInstance,
  api: typeof import('../../src/api').api,
  scopeDir: string,
  workspaceId: string,
  sourceDirectory: string,
) {
  const remoteUrl = `https://example.invalid/acme/${workspaceId}.git`;
  const cacheDirectory = server.remoteManager.getCacheDirForUrl(remoteUrl);
  fs.mkdirSync(path.dirname(cacheDirectory), { recursive: true });
  if (!fs.existsSync(path.join(cacheDirectory, '.git'))) {
    runGit(scopeDir, ['clone', '--quiet', sourceDirectory, cacheDirectory]);
  }
  const repo = await server.remoteManager.addRemoteRepoToWorkspace(workspaceId, {
    sourceType: 'remote',
    remoteUrl,
    name: '远程缓存',
    role: 'REMOTE',
    kind: 'hybrid',
    autoSyncIntervalMinutes: 0,
  });
  return { repo, cacheDirectory } satisfies RemoteCacheSpec;
}
