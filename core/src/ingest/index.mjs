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

/** @type {{ key: keyof JDSections; re: RegExp }[]} */
const SECTION_PATTERNS = [
  { key: 'responsibilities', re: /^(responsibilities|what you'?ll do|the role)\b/i },
  { key: 'requirements', re: /^(requirements|qualifications|what we'?re looking for|must[- ]?haves?)\b/i },
  { key: 'niceToHave', re: /^(nice[- ]to[- ]have|bonus|preferred|pluses)\b/i },
  { key: 'about', re: /^(about|who we are|the company)\b/i },
  { key: 'comp', re: /^(compensation|salary|pay|benefits)\b/i },
];

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
    const match = SECTION_PATTERNS.find((p) => p.re.test(headingText));
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
