export interface SplitRow {
  left?: string;
  right?: string;
  leftType: 'context' | 'del' | 'empty' | 'hunk';
  rightType: 'context' | 'add' | 'empty' | 'hunk';
}

export function buildSplitRows(patch: string): SplitRow[] {
  const lines = patch.split(/\r?\n/);
  const rows: SplitRow[] = [];
  let delQueue: string[] = [];
  let addQueue: string[] = [];

  const flushQueues = () => {
    const maxLength = Math.max(delQueue.length, addQueue.length);
    for (let index = 0; index < maxLength; index += 1) {
      rows.push({
        left: delQueue[index],
        right: addQueue[index],
        leftType: delQueue[index] !== undefined ? 'del' : 'empty',
        rightType: addQueue[index] !== undefined ? 'add' : 'empty',
      });
    }
    delQueue = [];
    addQueue = [];
  };

  for (const line of lines) {
    if (
      line.startsWith('diff --git') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('new file mode') ||
      line.startsWith('deleted file mode')
    ) {
      continue;
    }
    if (line.startsWith('@@')) {
      flushQueues();
      rows.push({ left: line, right: line, leftType: 'hunk', rightType: 'hunk' });
      continue;
    }
    if (line.startsWith('-')) {
      delQueue.push(line.slice(1));
      continue;
    }
    if (line.startsWith('+')) {
      addQueue.push(line.slice(1));
      continue;
    }
    flushQueues();
    const content = line.startsWith(' ') ? line.slice(1) : line;
    rows.push({ left: content, right: content, leftType: 'context', rightType: 'context' });
  }

  flushQueues();
  return rows;
}
