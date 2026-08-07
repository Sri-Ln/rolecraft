import { createHash } from 'node:crypto';

/**
 * @param {string | undefined} company
 * @param {string} title
 * @param {string} raw
 * @returns {string}
 */
export function jdId(company, title, raw) {
  const key = [
    (company ?? '').trim().toLowerCase(),
    title.trim().toLowerCase(),
    raw.trim(),
  ].join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}
