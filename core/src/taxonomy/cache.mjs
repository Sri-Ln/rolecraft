import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { VOCAB } from './vocab.mjs';

/**
 * @typedef {import('../schema/index.mjs').SkillCache} SkillCache
 */

/**
 * @param {string} path
 * @returns {SkillCache}
 */
export function loadCache(path) {
  if (!existsSync(path)) return {};
  return /** @type {SkillCache} */ (JSON.parse(readFileSync(path, 'utf8')));
}

/**
 * @param {string} path
 * @param {SkillCache} cache
 */
export function saveCache(path, cache) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

// Deep-clone so callers never mutate the input.
/**
 * @param {SkillCache} cache
 * @returns {SkillCache}
 */
function clone(cache) {
  /** @type {SkillCache} */
  const next = {};
  for (const [k, v] of Object.entries(cache)) next[k] = { ...v, aliases: [...v.aliases] };
  return next;
}

// Pre-warm a cache from the seed vocabulary. Adds missing entries with seen=0;
// never overwrites entries the user has already accumulated.
/**
 * @param {SkillCache} cache
 * @returns {SkillCache}
 */
export function seedFromVocab(cache) {
  const next = clone(cache);
  for (const entry of VOCAB) {
    if (!next[entry.canonical]) {
      next[entry.canonical] = {
        canonical: entry.canonical,
        aliases: [...entry.aliases],
        domain: entry.domain,
        seen: 0,
      };
    }
  }
  return next;
}

/**
 * @typedef {object} NewSkill
 * @property {string} canonical
 * @property {string} [surface]
 * @property {string} [domain]
 */

// Merge model-extracted (or cache-hit) skills into the cache: dedupe aliases,
// bump seen counts, create entries that don't exist yet. Returns a new cache.
/**
 * @param {SkillCache} cache
 * @param {NewSkill[]} skills
 * @returns {SkillCache}
 */
export function mergeSkills(cache, skills) {
  const next = clone(cache);
  for (const s of skills) {
    const key = s.canonical.trim().toLowerCase();
    if (!key) continue;
    const surface = s.surface?.trim().toLowerCase();
    const existing = next[key];
    if (existing) {
      if (surface && !existing.aliases.includes(surface)) existing.aliases.push(surface);
      existing.seen += 1;
    } else {
      next[key] = {
        canonical: key,
        aliases: surface && surface !== key ? [key, surface] : [key],
        domain: s.domain,
        seen: 1,
      };
    }
  }
  return next;
}
