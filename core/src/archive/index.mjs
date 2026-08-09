import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * @typedef {import('../schema/index.mjs').JDRecord} JDRecord
 */

/**
 * @param {string} storePath
 * @param {JDRecord} record
 */
export function appendRecord(storePath, record) {
  mkdirSync(dirname(storePath), { recursive: true });
  appendFileSync(storePath, JSON.stringify(record) + '\n', 'utf8');
}

/**
 * @param {string} storePath
 * @returns {JDRecord[]}
 */
export function readRecords(storePath) {
  if (!existsSync(storePath)) return [];
  return readFileSync(storePath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => /** @type {JDRecord} */ (JSON.parse(line)));
}
