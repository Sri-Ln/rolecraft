import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendRecord, readRecords } from '../src/archive/index.js';
import { JDRecord } from '../src/schema/index.js';

const dirs: string[] = [];
function tmpStore(): string {
  const d = mkdtempSync(join(tmpdir(), 'rolecraft-'));
  dirs.push(d);
  return join(d, 'nested', 'jds.jsonl');
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const rec = (id: string): JDRecord => ({
  jd: {
    id, source: 'paste', title: 'X', sections: {}, raw: 'r', capturedAt: '2026-06-20',
  },
  tags: [{ canonical: 'java', surface: 'Java', bucket: 'required', source: 'cache' }],
});

describe('archive', () => {
  it('returns [] when the store does not exist', () => {
    expect(readRecords(tmpStore())).toEqual([]);
  });

  it('appends and reads back records, creating parent dirs', () => {
    const store = tmpStore();
    appendRecord(store, rec('a'));
    appendRecord(store, rec('b'));
    const out = readRecords(store);
    expect(out.map((r) => r.jd.id)).toEqual(['a', 'b']);
    expect(out[0].tags[0].canonical).toBe('java');
  });

  it('ignores blank trailing lines', () => {
    const store = tmpStore();
    appendRecord(store, rec('a'));
    expect(readRecords(store)).toHaveLength(1);
  });
});
