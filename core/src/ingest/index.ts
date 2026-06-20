import { CanonicalJD, JDSections, JDSource } from '../schema/index.js';
import { jdId } from '../util/hash.js';

const SPLIT_MARKER = /^---NEW JOB---$/m;

export function splitJDs(raw: string): string[] {
  return raw
    .split(SPLIT_MARKER)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const SECTION_PATTERNS: { key: keyof JDSections; re: RegExp }[] = [
  { key: 'responsibilities', re: /^(responsibilities|what you'?ll do|the role)\b/i },
  { key: 'requirements', re: /^(requirements|qualifications|what we'?re looking for|must[- ]?haves?)\b/i },
  { key: 'niceToHave', re: /^(nice[- ]to[- ]have|bonus|preferred|pluses)\b/i },
  { key: 'about', re: /^(about|who we are|the company)\b/i },
  { key: 'comp', re: /^(compensation|salary|pay|benefits)\b/i },
];

function stripHeadingMarks(line: string): string {
  return line.replace(/^#+\s*/, '').replace(/[:*_#]+$/g, '').trim();
}

function extractTitle(lines: string[]): string {
  const first = lines.find((l) => l.trim().length > 0) ?? '';
  return stripHeadingMarks(first);
}

function extractCompany(lines: string[]): string | undefined {
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

function detectSections(lines: string[]): JDSections {
  const buf: Partial<Record<keyof JDSections, string[]>> = {};
  let current: keyof JDSections | null = null;

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

  const sections: JDSections = {};
  for (const key of Object.keys(buf) as (keyof JDSections)[]) {
    const text = (buf[key] ?? []).join('\n').trim();
    if (text) sections[key] = text;
  }
  return sections;
}

export function normalize(segment: string, source: JDSource, sourceUrl?: string): CanonicalJD {
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
