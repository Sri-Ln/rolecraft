import { CanonicalJD, SkillBucket, SkillTag } from '../schema/index.js';
import { VOCAB } from './vocab.js';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match an alias only on token boundaries so "go" doesn't match "gocarts"
// and "javascript" doesn't match "javascripting". The lookbehind blocks
// matches that are preceded by a word char, '.', or '#' (so "node" won't
// match inside ".node_modules" or "#node"). The lookahead blocks a plain
// word char OR a dot followed by a word char (so "node" won't match in
// "node.js"), but a bare trailing period (sentence end) is allowed.
function aliasRegex(alias: string): RegExp {
  return new RegExp(`(?<![\\w.#])${escapeRe(alias)}(?![\\w]|\\.[\\w])`, 'i');
}

function matchSurface(text: string): { canonical: string; surface: string }[] {
  const hits: { canonical: string; surface: string }[] = [];
  for (const entry of VOCAB) {
    for (const alias of entry.aliases) {
      const m = aliasRegex(alias).exec(text);
      if (m) {
        hits.push({ canonical: entry.canonical, surface: m[0] });
        break; // one hit per canonical entry is enough
      }
    }
  }
  return hits;
}

export function tag(jd: CanonicalJD): SkillTag[] {
  const found = new Map<string, SkillTag>();

  const apply = (text: string | undefined, bucket: SkillBucket, allowUpgrade: boolean) => {
    if (!text) return;
    for (const hit of matchSurface(text)) {
      const existing = found.get(hit.canonical);
      if (!existing) {
        found.set(hit.canonical, { ...hit, bucket });
      } else if (allowUpgrade && existing.bucket === 'nice' && bucket === 'required') {
        found.set(hit.canonical, { ...hit, bucket });
      }
    }
  };

  // Section passes (ordered so 'required' can upgrade an earlier 'nice').
  apply(jd.sections.requirements, 'required', true);
  apply(jd.sections.responsibilities, 'required', true);
  apply(jd.sections.niceToHave, 'nice', true);
  // Fallback: anything mentioned only in the body (no detected sections)
  // defaults to required; never re-buckets an already-classified skill.
  apply(jd.raw, 'required', false);

  return [...found.values()];
}
