import { describe, it, expect } from 'vitest';
import { splitJDs, normalize } from '../src/ingest/index.mjs';

const SAMPLE = `Senior Backend Engineer
Company: Acme Corp
Remote (US)

Responsibilities
Build and operate payment services.

Requirements
5+ years with Java and Spring. Strong SQL.

Nice to have
Exposure to Kafka.`;

describe('splitJDs', () => {
  it('splits on the ---NEW JOB--- marker and trims', () => {
    const out = splitJDs('one\n---NEW JOB---\ntwo');
    expect(out).toEqual(['one', 'two']);
  });

  it('drops empty segments', () => {
    const out = splitJDs('only\n---NEW JOB---\n   \n');
    expect(out).toEqual(['only']);
  });

  it('returns a single segment when no marker', () => {
    expect(splitJDs('just one')).toEqual(['just one']);
  });
});

describe('normalize', () => {
  it('extracts title from the first non-empty line', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.title).toBe('Senior Backend Engineer');
  });

  it('extracts company from a Company: line', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.company).toBe('Acme Corp');
  });

  it('detects the requirements and niceToHave sections', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.sections.requirements).toContain('Java and Spring');
    expect(jd.sections.niceToHave).toContain('Kafka');
  });

  it('retains the raw body and sets source + a date id', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.source).toBe('paste');
    expect(jd.raw).toContain('payment services');
    expect(jd.id).toMatch(/^[0-9a-f]{16}$/);
    expect(jd.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
