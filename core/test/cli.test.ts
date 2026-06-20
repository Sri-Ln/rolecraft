import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.js';
import { readRecords } from '../src/archive/index.js';

const testDir = dirname(fileURLToPath(import.meta.url)); // core/test
const coreDir = dirname(testDir);                        // core
const repoRoot = dirname(coreDir);                       // repo root
const cliPath = join(coreDir, 'src', 'cli.ts');

const dirs: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'rolecraft-cli-'));
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const TWO = `Engineer A
Requirements
Java and React.
---NEW JOB---
Engineer B
Requirements
Python and Docker.`;

describe('run', () => {
  it('produces one record per JD with tags', () => {
    const recs = run(TWO, 'paste');
    expect(recs).toHaveLength(2);
    expect(recs[0].tags.map((t) => t.canonical).sort()).toEqual(['java', 'react']);
    expect(recs[1].tags.map((t) => t.canonical).sort()).toEqual(['docker', 'python']);
  });
});

describe('main (spawned)', () => {
  it('reads a file, prints JSON, and appends to the store', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    writeFileSync(inbox, TWO, 'utf8');

    const out = execFileSync(
      process.execPath,
      ['--import', 'tsx', cliPath, 'process', inbox, '--store', store],
      { encoding: 'utf8', cwd: repoRoot },
    );

    const parsed = JSON.parse(out);
    expect(parsed).toHaveLength(2);
    expect(readRecords(store)).toHaveLength(2);
  });
});
