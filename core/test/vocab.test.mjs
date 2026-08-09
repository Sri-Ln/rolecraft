import { describe, it, expect } from 'vitest';
import { VOCAB } from '../src/taxonomy/vocab.mjs';

describe('VOCAB loader', () => {
  it('loads entries from the data files', () => {
    expect(VOCAB.length).toBeGreaterThanOrEqual(23);
  });

  it('includes known tech skills with their domain tagged', () => {
    const java = VOCAB.find((e) => e.canonical === 'java');
    expect(java).toBeDefined();
    expect(java?.domain).toBe('tech');
    expect(java?.aliases).toContain('java');
  });

  it('resolves a multi-alias entry (kubernetes/k8s)', () => {
    const k = VOCAB.find((e) => e.canonical === 'kubernetes');
    expect(k?.aliases).toContain('k8s');
  });
});
