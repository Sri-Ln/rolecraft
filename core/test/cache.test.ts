import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCache, saveCache, seedFromVocab, mergeSkills } from '../src/taxonomy/cache.js';

const dirs: string[] = [];
function tmpPath(): string {
  const d = mkdtempSync(join(tmpdir(), 'rolecraft-cache-'));
  dirs.push(d);
  return join(d, 'nested', 'learned-skills.json');
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('loadCache / saveCache', () => {
  it('returns {} when the file does not exist', () => {
    expect(loadCache(tmpPath())).toEqual({});
  });

  it('round-trips a cache, creating parent dirs', () => {
    const p = tmpPath();
    saveCache(p, { java: { canonical: 'java', aliases: ['java'], domain: 'tech', seen: 2 } });
    expect(loadCache(p).java.seen).toBe(2);
  });
});

describe('seedFromVocab', () => {
  it('adds seed entries with seen=0 and does not overwrite existing', () => {
    const seeded = seedFromVocab({ java: { canonical: 'java', aliases: ['java'], domain: 'tech', seen: 9 } });
    expect(seeded.kubernetes.seen).toBe(0);          // newly seeded
    expect(seeded.kubernetes.aliases).toContain('k8s');
    expect(seeded.java.seen).toBe(9);                // preserved, not reset
  });
});

describe('mergeSkills', () => {
  it('creates a new entry with seen=1', () => {
    const out = mergeSkills({}, [{ canonical: 'Rust', surface: 'Rust' }]);
    expect(out.rust).toBeDefined();
    expect(out.rust.seen).toBe(1);
    expect(out.rust.aliases).toContain('rust');
  });

  it('bumps seen and adds a new surface alias for an existing entry', () => {
    const start = { kubernetes: { canonical: 'kubernetes', aliases: ['kubernetes'], domain: 'tech', seen: 1 } };
    const out = mergeSkills(start, [{ canonical: 'kubernetes', surface: 'K8s' }]);
    expect(out.kubernetes.seen).toBe(2);
    expect(out.kubernetes.aliases).toContain('k8s');
  });

  it('does not mutate the input cache', () => {
    const start = { java: { canonical: 'java', aliases: ['java'], domain: 'tech', seen: 1 } };
    mergeSkills(start, [{ canonical: 'java', surface: 'Java' }]);
    expect(start.java.seen).toBe(1); // original untouched
  });
});
