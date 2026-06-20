import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { JDRecord } from '../schema/index.js';

export function appendRecord(storePath: string, record: JDRecord): void {
  mkdirSync(dirname(storePath), { recursive: true });
  appendFileSync(storePath, JSON.stringify(record) + '\n', 'utf8');
}

export function readRecords(storePath: string): JDRecord[] {
  if (!existsSync(storePath)) return [];
  return readFileSync(storePath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as JDRecord);
}
