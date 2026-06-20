import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Category is domain-defined (tech uses language|framework|tool|infra; other
// domains define their own). Kept as a free string so the engine is not
// tied to software roles.
export type VocabCategory = string;

export interface VocabEntry {
  canonical: string;
  category: VocabCategory;
  aliases: string[]; // lowercase; include the canonical surface form
  domain?: string;   // set from the data file the entry came from
}

interface VocabFile {
  domain: string;
  entries: { canonical: string; category: string; aliases: string[] }[];
}

// Vocabulary lives as data under core/data/vocab/*.json — one file per domain.
// Resolve relative to this source file so it works regardless of cwd.
function loadVocab(): VocabEntry[] {
  const here = dirname(fileURLToPath(import.meta.url)); // core/src/taxonomy
  const dataDir = join(here, '..', '..', 'data', 'vocab');
  const all: VocabEntry[] = [];
  for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
    const parsed = JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as VocabFile;
    for (const entry of parsed.entries) {
      all.push({ ...entry, domain: parsed.domain });
    }
  }
  return all;
}

export const VOCAB: VocabEntry[] = loadVocab();
