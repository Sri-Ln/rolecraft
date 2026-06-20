import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.js';
import { readRecords } from '../src/archive/index.js';
import { loadCache } from '../src/taxonomy/cache.js';

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

describe('process (cache integration, spawned)', () => {
  it('creates+updates the learned cache and bumps seen on reprocess', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    writeFileSync(inbox, 'Engineer\nRequirements\nJava and React.', 'utf8');

    const args = ['--import', 'tsx', cliPath, 'process', inbox, '--store', store, '--cache', cache];
    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: repoRoot });
    const after1 = loadCache(cache);
    expect(after1.java.seen).toBe(1);

    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: repoRoot });
    const after2 = loadCache(cache);
    expect(after2.java.seen).toBe(2); // reprocess bumps the count
  });
});

describe('learn (spawned)', () => {
  it('merges model-extracted skills from a file into the cache', () => {
    const d = tmp();
    const cache = join(d, 'learned-skills.json');
    const skillsFile = join(d, 'new-skills.json');
    writeFileSync(
      skillsFile,
      JSON.stringify([{ canonical: 'settlement-risk', surface: 'settlement risk', domain: 'finance' }]),
      'utf8',
    );

    execFileSync(
      process.execPath,
      ['--import', 'tsx', cliPath, 'learn', '--cache', cache, '--skills-file', skillsFile],
      { encoding: 'utf8', cwd: repoRoot },
    );

    const out = loadCache(cache);
    expect(out['settlement-risk'].seen).toBe(1);
    expect(out['settlement-risk'].domain).toBe('finance');
  });
});

describe('process (no seed pollution, spawned)', () => {
  it('persists only skills actually seen, never the unused seed vocab', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    writeFileSync(inbox, 'Engineer\nRequirements\nJava only.', 'utf8');

    execFileSync(
      process.execPath,
      ['--import', 'tsx', cliPath, 'process', inbox, '--store', store, '--cache', cache],
      { encoding: 'utf8', cwd: repoRoot },
    );

    const out = loadCache(cache);
    expect(out.java.seen).toBe(1);       // matched → persisted
    expect(out.java.domain).toBe('tech'); // domain carried over from the seed
    expect(out.kubernetes).toBeUndefined(); // seed skill not in JD → NOT persisted
    expect(out.python).toBeUndefined();
  });
});
