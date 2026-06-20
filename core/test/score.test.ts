import { describe, it, expect } from 'vitest';
import { score } from '../evals/score.js';

describe('score', () => {
  it('is perfect when sets match', () => {
    const r = score(['java', 'react'], ['react', 'java']);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(1);
    expect(r.f1).toBe(1);
  });

  it('penalizes a false positive in precision', () => {
    const r = score(['java', 'go'], ['java']);
    expect(r.precision).toBe(0.5);
    expect(r.recall).toBe(1);
  });

  it('penalizes a miss in recall', () => {
    const r = score(['java'], ['java', 'react']);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(0.5);
  });

  it('treats two empty sets as perfect', () => {
    const r = score([], []);
    expect(r.f1).toBe(1);
  });
});
