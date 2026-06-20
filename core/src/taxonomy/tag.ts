import { CanonicalJD, SkillBucket, SkillTag } from '../schema/index.js';

// Anything with a canonical key and surface aliases can be matched: the seed
// VOCAB or the user's learned cache both satisfy this shape.
export interface Matchable {
  canonical: string;
  aliases: string[];
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match an alias only on token boundaries so "go" doesn't match "gocarts" and
// "java" doesn't match "javascript". A trailing bare period is allowed
// (e.g. "Go."), but "node.js" is not split into "node".
function aliasRegex(alias: string): RegExp {
  return new RegExp(`(?<![\\w.#])${escapeRe(alias)}(?![\\w]|\\.[\\w])`, 'i');
}

function matchSurface(text: string, entries: Matchable[]): { canonical: string; surface: string }[] {
  const hits: { canonical: string; surface: string }[] = [];
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const m = aliasRegex(alias).exec(text);
      if (m) {
        hits.push({ canonical: entry.canonical, surface: m[0] });
        break;
      }
    }
  }
  return hits;
}

// Deterministic cache/seed pass: tag a JD against a list of known skills.
export function tag(jd: CanonicalJD, entries: Matchable[]): SkillTag[] {
  const found = new Map<string, SkillTag>();

  const apply = (text: string | undefined, bucket: SkillBucket, allowUpgrade: boolean) => {
    if (!text) return;
    for (const hit of matchSurface(text, entries)) {
      const existing = found.get(hit.canonical);
      if (!existing) {
        found.set(hit.canonical, { ...hit, bucket, source: 'cache' });
      } else if (allowUpgrade && existing.bucket === 'nice' && bucket === 'required') {
        found.set(hit.canonical, { ...hit, bucket, source: 'cache' });
      }
    }
  };

  apply(jd.sections.requirements, 'required', true);
  apply(jd.sections.responsibilities, 'required', true);
  apply(jd.sections.niceToHave, 'nice', true);
  apply(jd.raw, 'required', false);

  return [...found.values()];
}
