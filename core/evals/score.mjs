/**
 * @typedef {object} PR
 * @property {number} precision
 * @property {number} recall
 * @property {number} f1
 */

/**
 * @param {string[]} predicted
 * @param {string[]} expected
 * @returns {PR}
 */
export function score(predicted, expected) {
  const p = new Set(predicted);
  const e = new Set(expected);
  let tp = 0;
  for (const x of p) if (e.has(x)) tp++;
  const precision = p.size ? tp / p.size : 1;
  const recall = e.size ? tp / e.size : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}
