import { createHash } from 'node:crypto';

export function jdId(company: string | undefined, title: string, raw: string): string {
  const key = [
    (company ?? '').trim().toLowerCase(),
    title.trim().toLowerCase(),
    raw.trim(),
  ].join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}
