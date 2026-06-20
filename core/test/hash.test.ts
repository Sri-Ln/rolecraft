import { describe, it, expect } from 'vitest';
import { jdId } from '../src/util/hash.js';

describe('jdId', () => {
  it('is stable for the same inputs', () => {
    const a = jdId('Acme', 'Backend Engineer', 'raw text');
    const b = jdId('Acme', 'Backend Engineer', 'raw text');
    expect(a).toBe(b);
  });

  it('is case- and whitespace-insensitive for company/title', () => {
    const a = jdId('Acme', 'Backend Engineer', 'raw text');
    const b = jdId('  acme ', ' backend engineer ', 'raw text');
    expect(a).toBe(b);
  });

  it('changes when raw body changes', () => {
    const a = jdId('Acme', 'Backend Engineer', 'raw text one');
    const b = jdId('Acme', 'Backend Engineer', 'raw text two');
    expect(a).not.toBe(b);
  });

  it('returns a 16-char hex string', () => {
    expect(jdId(undefined, 'X', 'y')).toMatch(/^[0-9a-f]{16}$/);
  });
});
