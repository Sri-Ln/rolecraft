/**
 * @typedef {import('../schema/index.mjs').CanonicalJD} CanonicalJD
 * @typedef {import('../schema/index.mjs').SkillBucket} SkillBucket
 * @typedef {import('../schema/index.mjs').SkillTag} SkillTag
 */

// Anything with a canonical key and surface aliases can be matched: the seed
// VOCAB or the user's learned cache both satisfy this shape.
/**
 * @typedef {object} Matchable
 * @property {string} canonical
 * @property {string[]} aliases
 */

/**
 * @param {string} s
 * @returns {string}
 */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match an alias only on token boundaries so "go" doesn't match "gocarts" and
// "java" doesn't match "javascript". A trailing bare period is allowed
// (e.g. "Go."), but "node.js" is not split into "node".
/**
 * @param {string} alias
 * @returns {RegExp}
 */
function aliasRegex(alias) {
  return new RegExp(`(?<![\\w.#])${escapeRe(alias)}(?![\\w]|\\.[\\w])`, 'i');
}

/**
 * @param {string} text
 * @param {Matchable[]} entries
 * @returns {{ canonical: string; surface: string }[]}
 */
function matchSurface(text, entries) {
  /** @type {{ canonical: string; surface: string }[]} */
  const hits = [];
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

// The posting minus its nice-to-have block. Compared line by line because the
// sections were built from these same lines, so the two always agree.
/**
 * @param {CanonicalJD} jd
 * @returns {string}
 */
function outsideNiceToHave(jd) {
  const nice = jd.sections.niceToHave;
  if (!nice) return jd.raw;
  const niceLines = new Set(nice.split('\n'));
  return jd.raw
    .split(/\r?\n/)
    .filter((line) => !niceLines.has(line))
    .join('\n');
}

// Deterministic cache/seed pass: tag a JD against a list of known skills.
/**
 * @param {CanonicalJD} jd
 * @param {Matchable[]} entries
 * @returns {SkillTag[]}
 */
export function tag(jd, entries) {
  /** @type {Map<string, SkillTag>} */
  const found = new Map();

  /**
   * @param {string | undefined} text
   * @param {SkillBucket} bucket
   * @param {boolean} allowUpgrade
   */
  const apply = (text, bucket, allowUpgrade) => {
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

  // Final sweep over everything that is NOT the wishlist. A skill named
  // anywhere else in the posting is treated as expected, and may promote one
  // first seen in the nice-to-have list — that is what rescues a requirement
  // when an unusual heading kept its section from being detected. Slightly
  // over-eager (an "about us" mention counts), which is the safer error:
  // marking a real requirement optional quietly costs you study time.
  apply(outsideNiceToHave(jd), 'required', true);

  return [...found.values()];
}
