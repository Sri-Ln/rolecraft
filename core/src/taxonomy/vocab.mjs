import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Category is domain-defined (tech uses language|framework|tool|infra; other
// domains define their own). Kept as a free string so the engine is not
// tied to software roles.
/**
 * @typedef {string} VocabCategory
 */

/**
 * @typedef {object} VocabEntry
 * @property {string} canonical
 * @property {VocabCategory} category
 * @property {string[]} aliases lowercase; include the canonical surface form
 * @property {string} [domain] set from the data file the entry came from
 */

/**
 * @typedef {object} VocabFile
 * @property {string} domain
 * @property {{ canonical: string; category: string; aliases: string[] }[]} entries
 */

// Vocabulary lives as data under core/data/vocab/*.json — one file per domain.
// Resolve relative to this source file so it works regardless of cwd.
/**
 * @returns {VocabEntry[]}
 */
function loadVocab() {
  const here = dirname(fileURLToPath(import.meta.url)); // core/src/taxonomy
  const dataDir = join(here, '..', '..', 'data', 'vocab');
  /** @type {VocabEntry[]} */
  const all = [];
  for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
    const parsed = /** @type {VocabFile} */ (
      JSON.parse(readFileSync(join(dataDir, file), 'utf8'))
    );
    for (const entry of parsed.entries) {
      all.push({ ...entry, domain: parsed.domain });
    }
  }
  return all;
}

/** @type {VocabEntry[]} */
export const VOCAB = loadVocab();
