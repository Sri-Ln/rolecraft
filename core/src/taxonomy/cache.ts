import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { SkillCache } from '../schema/index.js';
import { VOCAB } from './vocab.js';

export function loadCache(path: string): SkillCache {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')) as SkillCache;
}

export function saveCache(path: string, cache: SkillCache): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

// Deep-clone so callers never mutate the input.
function clone(cache: SkillCache): SkillCache {
  const next: SkillCache = {};
  for (const [k, v] of Object.entries(cache)) next[k] = { ...v, aliases: [...v.aliases] };
  return next;
}

// Pre-warm a cache from the seed vocabulary. Adds missing entries with seen=0;
// never overwrites entries the user has already accumulated.
export function seedFromVocab(cache: SkillCache): SkillCache {
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

export interface NewSkill {
  canonical: string;
  surface?: string;
  domain?: string;
}

// Merge model-extracted (or cache-hit) skills into the cache: dedupe aliases,
// bump seen counts, create entries that don't exist yet. Returns a new cache.
export function mergeSkills(cache: SkillCache, skills: NewSkill[]): SkillCache {
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
