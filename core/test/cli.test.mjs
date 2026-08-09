import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.mjs';
import { readRecords } from '../src/archive/index.mjs';
import { loadCache } from '../src/taxonomy/cache.mjs';

const testDir = dirname(fileURLToPath(import.meta.url)); // core/test
const coreDir = dirname(testDir);                        // core
const cliPath = join(coreDir, 'src', 'cli.mjs');

/** @type {string[]} */
const dirs = [];
function tmp() {
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

// Every spawn below runs plain `node <cli>` from a throwaway cwd: the engine
// must work with no loader, no build step and no node_modules in scope.
describe('main (spawned)', () => {
  it('reads a file, prints JSON, and appends to the store', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    writeFileSync(inbox, TWO, 'utf8');

    const out = execFileSync(
      process.execPath,
      [cliPath, 'process', inbox, '--store', store],
      { encoding: 'utf8', cwd: d },
    );

    const parsed = JSON.parse(out);
    expect(parsed).toHaveLength(2);
    expect(readRecords(store)).toHaveLength(2);
  });
});

describe('process (cache integration, spawned)', () => {
  it('creates the learned cache, then leaves counts alone on an identical reprocess', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    writeFileSync(inbox, 'Engineer\nRequirements\nJava and React.', 'utf8');

    const args = [cliPath, 'process', inbox, '--store', store, '--cache', cache];
    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: d });
    expect(loadCache(cache).java.seen).toBe(1);

    // Same bytes → same id → already processed, so nothing is counted twice.
    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: d });
    expect(loadCache(cache).java.seen).toBe(1);
    expect(readRecords(store)).toHaveLength(1);
  });

  it('marks the skipped JD as a duplicate in its output', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    writeFileSync(inbox, 'Engineer\nRequirements\nJava and React.', 'utf8');

    const args = [cliPath, 'process', inbox, '--store', store, '--cache', cache];
    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: d });
    const out = JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8', cwd: d }));

    expect(out[0].duplicate.skipped).toBe(true);
    expect(out[0].duplicate.firstSeenAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('counts an identical JD again under --allow-duplicates', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    writeFileSync(inbox, 'Engineer\nRequirements\nJava and React.', 'utf8');

    const args = [cliPath, 'process', inbox, '--store', store, '--cache', cache];
    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: d });
    const out = JSON.parse(
      execFileSync(process.execPath, [...args, '--allow-duplicates'], { encoding: 'utf8', cwd: d }),
    );

    expect(loadCache(cache).java.seen).toBe(2); // deliberate repost, counted
    expect(readRecords(store)).toHaveLength(2);
    expect(out[0].duplicate.skipped).toBe(false); // still flagged as a repeat
  });

  it('skips a JD repeated inside one paste, but keeps a different role with the same title', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    const SDE = 'SDE II\nCompany: Amazon\nRequirements\nJava and AWS.';
    const OTHER = 'SDE II\nCompany: Amazon\nRequirements\nPython and Docker.';
    writeFileSync(inbox, [SDE, OTHER, SDE].join('\n---NEW JOB---\n'), 'utf8');

    execFileSync(
      process.execPath,
      [cliPath, 'process', inbox, '--store', store, '--cache', cache],
      { encoding: 'utf8', cwd: d },
    );

    // Same company+title, different body → a real second role, kept.
    expect(readRecords(store)).toHaveLength(2);
    const out = loadCache(cache);
    expect(out.java.seen).toBe(1); // the repeat did not double-count
    expect(out.python.seen).toBe(1);
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
      [cliPath, 'learn', '--cache', cache, '--skills-file', skillsFile],
      { encoding: 'utf8', cwd: d },
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
      [cliPath, 'process', inbox, '--store', store, '--cache', cache],
      { encoding: 'utf8', cwd: d },
    );

    const out = loadCache(cache);
    expect(out.java.seen).toBe(1);       // matched → persisted
    expect(out.java.domain).toBe('tech'); // domain carried over from the seed
    expect(out.kubernetes).toBeUndefined(); // seed skill not in JD → NOT persisted
    expect(out.python).toBeUndefined();
  });
});
