/**
 * @file 真实 git 仓库 fixture
 * @description 封装测试所需的本机 git 操作。仅 e2e helper 可调用 git CLI，
 *   测试描述文件禁止直接执行 git 或读写本机文件。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let emptyGitConfigPath = '';

function gitEnv(date?: string): Record<string, string> {
  return {
    GIT_TERMINAL_PROMPT: '0',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: emptyGitConfigPath,
    ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}),
  };
}

export function runGit(cwd: string, args: string[], date?: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...gitEnv(date) },
  });
}

/** 分配隔离的 git 全局配置，避免污染本机 git 设置。 */
export function isolateGitConfig(scopeDir: string): void {
  emptyGitConfigPath = path.join(scopeDir, 'empty.gitconfig');
  fs.writeFileSync(emptyGitConfigPath, '', 'utf8');
}

/**
 * 初始化带一次提交的真实 git 仓库，返回仓库目录。
 * 父目录由调用方经 fixtures 分配并传入，避免模块循环依赖。
 */
export function initGitRepo(scopeDir: string, prefix: string): string {
  const directory = path.join(scopeDir, `${prefix}${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
  fs.mkdirSync(directory, { recursive: true });
  runGit(directory, ['init', '-b', 'main']);
  runGit(directory, ['config', 'user.name', 'Tester']);
  runGit(directory, ['config', 'user.email', 'tester@example.com']);
  fs.writeFileSync(path.join(directory, 'README.md'), 'initial\n', 'utf8');
  runGit(directory, ['add', '.']);
  runGit(directory, ['commit', '-m', 'initial commit'], '2026-01-01T00:00:00Z');
  return directory;
}

/** 在仓库内写入文件并提交。 */
export function commitFile(
  directory: string,
  relativePath: string,
  content: string,
  message: string,
  authorName: string,
  authorEmail: string,
  date: string,
): void {
  const filePath = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  runGit(directory, ['config', 'user.name', authorName]);
  runGit(directory, ['config', 'user.email', authorEmail]);
  runGit(directory, ['add', '.']);
  runGit(directory, ['commit', '-m', message], date);
}
