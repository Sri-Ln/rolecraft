import { jdId } from '../util/hash.mjs';

/**
 * @typedef {import('../schema/index.mjs').CanonicalJD} CanonicalJD
 * @typedef {import('../schema/index.mjs').JDSections} JDSections
 * @typedef {import('../schema/index.mjs').JDSource} JDSource
 */

const SPLIT_MARKER = /^---NEW JOB---$/m;

/**
 * @param {string} raw
 * @returns {string[]}
 */
export function splitJDs(raw) {
  return raw
    .split(SPLIT_MARKER)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Real postings qualify their headings — "Job Responsibilities", "Required
// Qualifications", "Basic Qualifications", "Skills and Experience" — so these
// match the keyword anywhere in a heading line rather than only at its start.
// ORDER MATTERS: nice-to-have is tested first because "Preferred
// Qualifications" is a wishlist heading even though it says "qualifications",
// and `about` precedes `responsibilities` so "About the role" isn't read as a
// duties list.
/** @type {{ key: keyof JDSections; re: RegExp }[]} */
const SECTION_PATTERNS = [
  { key: 'niceToHave', re: /\b(nice[- ]to[- ]have|bonus|preferred|plus(es)?|desirable|good to have)\b/i },
  { key: 'comp', re: /\b(compensation|salary|pay range|benefits)\b/i },
  { key: 'about', re: /\b(about|who we are|the company|the team)\b/i },
  { key: 'requirements', re: /\b(requirements?|required|qualifications|must[- ]?haves?|what we'?re looking for|skills? (and|&) experience)\b/i },
  { key: 'responsibilities', re: /\b(responsibilities|what you'?ll do|the role|duties)\b/i },
];

const MAX_HEADING_WORDS = 8;
const MAX_HEADING_CHARS = 60;
const BULLET = /^\s*(?:[-*•▪]|\d+[.)])\s+/;

// Matching keywords mid-line only works if body text can't pose as a heading:
// a heading is short, unbulleted and doesn't end like a sentence.
/**
 * @param {string} original the untouched line
 * @param {string} stripped the same line with heading marks removed
 * @returns {boolean}
 */
function isHeadingCandidate(original, stripped) {
  if (BULLET.test(original)) return false;
  if (stripped.length === 0 || stripped.length > MAX_HEADING_CHARS) return false;
  if (stripped.endsWith('.')) return false;
  return stripped.split(/\s+/).length <= MAX_HEADING_WORDS;
}

/**
 * @param {string} line
 * @returns {string}
 */
function stripHeadingMarks(line) {
  return line.replace(/^#+\s*/, '').replace(/[:*_#]+$/g, '').trim();
}

/**
 * @param {string[]} lines
 * @returns {string}
 */
function extractTitle(lines) {
  const first = lines.find((l) => l.trim().length > 0) ?? '';
  return stripHeadingMarks(first);
}

/**
 * @param {string[]} lines
 * @returns {string | undefined}
 */
function extractCompany(lines) {
  for (const line of lines) {
    const m = line.match(/^\s*company\s*[:\-]\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  for (const line of lines) {
    const m = line.match(/\bat\s+([A-Z][\w&.\-]*(?:\s+[A-Z][\w&.\-]*){0,3})/);
    if (m) return m[1].trim();
  }
  return undefined;
}

/**
 * @param {string[]} lines
 * @returns {JDSections}
 */
function detectSections(lines) {
  /** @type {Partial<Record<keyof JDSections, string[]>>} */
  const buf = {};
  /** @type {keyof JDSections | null} */
  let current = null;

  for (const line of lines) {
    const headingText = stripHeadingMarks(line);
    const match = isHeadingCandidate(line, headingText)
      ? SECTION_PATTERNS.find((p) => p.re.test(headingText))
      : undefined;
    if (match) {
      current = match.key;
      buf[current] ??= [];
      continue;
    }
    if (current) (buf[current] ??= []).push(line);
  }

  /** @type {JDSections} */
  const sections = {};
  for (const key of /** @type {(keyof JDSections)[]} */ (Object.keys(buf))) {
    const text = (buf[key] ?? []).join('\n').trim();
    if (text) sections[key] = text;
  }
  return sections;
}

/**
 * @param {string} segment
 * @param {JDSource} source
 * @param {string} [sourceUrl]
 * @returns {CanonicalJD}
 */
export function normalize(segment, source, sourceUrl) {
  const raw = segment.trim();
  const lines = raw.split(/\r?\n/);
  const title = extractTitle(lines);
  const company = extractCompany(lines);
  return {
    id: jdId(company, title, raw),
    source,
    sourceUrl,
    title,
    company,
    sections: detectSections(lines),
    raw,
    capturedAt: new Date().toISOString().slice(0, 10),
  };
}
