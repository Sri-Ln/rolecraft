export interface PR {
  precision: number;
  recall: number;
  f1: number;
}

export function score(predicted: string[], expected: string[]): PR {
  const p = new Set(predicted);
  const e = new Set(expected);
  let tp = 0;
  for (const x of p) if (e.has(x)) tp++;
  const precision = p.size ? tp / p.size : 1;
  const recall = e.size ? tp / e.size : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}
