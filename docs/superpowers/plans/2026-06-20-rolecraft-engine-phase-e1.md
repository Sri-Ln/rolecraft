# Rolecraft Engine — Phase E1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `core/` TypeScript engine and make the most-used path real software — one pasted JD flows `split → normalize → tag against taxonomy → append to store`, with structured JSON the `process` mode reasons over instead of extracting freehand.

**Architecture:** A plain TS library under `core/` (npm workspace) made of small pure modules — `schema`, `util/hash`, `ingest`, `taxonomy`, `archive` — plus a thin `cli.ts` the plugin shells out to and an `evals/` harness that scores skill-tagging precision/recall on a golden set. No build step in E1: tests run under vitest, the CLI runs under tsx. The engine's deterministic store is an append-only JSONL file (`user/data/.rolecraft/jds.jsonl`); the human-facing markdown trackers remain model-rendered views over the engine's output.

**Tech Stack:** TypeScript (ESM, NodeNext), Node 24, vitest (tests), tsx (run TS directly), Node built-in `crypto`/`fs`.

> **Spec deviation noted:** the design spec described the archive as a "markdown frontmatter store." This plan implements it as append-only JSONL instead — cleaner to round-trip than parsing the model's prose tables, and it keeps the markdown files as rendered views. Same role, better mechanism.

> **Scope note:** `comp/`, `aggregate/`, `gap/`, `similarity/`, `render/`, and the browser `extension/` are later phases (E2–E5). `SkillTag.bucket` includes `'unknown'` in the type, but E1's `tag()` emits only `'required'`/`'nice'` from the vocabulary — identifying *unknown* skills is the model's job (it reads `jd.raw` plus the engine tags and proposes vocab additions).

---

## File structure

| File | Responsibility |
|---|---|
| `package.json` (root) | Declares the npm workspace (`core` only in E1). |
| `core/package.json` | Core package: scripts (`test`, `cli`, `evals`), devDeps. |
| `core/tsconfig.json` | Strict ESM/NodeNext config; `noEmit` (tests/CLI run via vitest/tsx). |
| `core/vitest.config.ts` | Minimal vitest config. |
| `core/src/schema/index.ts` | Shared types: `CanonicalJD`, `SkillTag`, `CompRange`, `JDRecord`. The contract. |
| `core/src/util/hash.ts` | Stable JD id hashing. |
| `core/src/ingest/index.ts` | `splitJDs()` + `normalize()` + section detection: raw text → `CanonicalJD`. |
| `core/src/taxonomy/vocab.ts` | Controlled vocabulary (canonical skills + aliases + category). |
| `core/src/taxonomy/tag.ts` | `tag(jd)` → `SkillTag[]` (required/nice). |
| `core/src/archive/index.ts` | `appendRecord()` / `readRecords()` over the JSONL store. |
| `core/src/cli.ts` | `run()` (pure) + `main()` (file IO); `process <file>` → JSON + store append. |
| `core/evals/score.ts` | `score(predicted, expected)` → precision/recall/f1. |
| `core/evals/run-evals.ts` | Loads fixtures + expected, runs `run()`, prints scores. |
| `core/evals/fixtures/*.txt` | Golden JDs (anonymized). |
| `core/evals/expected/*.json` | Hand-labeled expected tags per fixture. |
| `core/test/*.test.ts` | Unit tests per module. |
| `modes/process.md` | Modified: shell out to the CLI; reason over its JSON. |
| `.gitignore` | Ensure `node_modules/` ignored (`user/` already is). |

---

## Task 1: Workspace + toolchain

**Files:**
- Create: `package.json`
- Create: `core/package.json`
- Create: `core/tsconfig.json`
- Create: `core/vitest.config.ts`
- Create: `core/test/smoke.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing smoke test**

Create `core/test/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs TypeScript tests', () => {
    const x: number = 1 + 1;
    expect(x).toBe(2);
  });
});
```

- [ ] **Step 2: Create the workspace + package files**

Create root `package.json`:

```json
{
  "name": "rolecraft-monorepo",
  "private": true,
  "workspaces": ["core"]
}
```

Create `core/package.json`:

```json
{
  "name": "@rolecraft/core",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "cli": "tsx src/cli.ts",
    "evals": "tsx evals/run-evals.ts"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

Create `core/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src", "evals", "test"]
}
```

Create `core/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
});
```

- [ ] **Step 3: Ensure `node_modules` is gitignored**

Open `.gitignore`. If it does not already contain a line `node_modules/`, add it. (Do NOT remove existing entries — `user/` must stay ignored.) Verify:

Run: `grep -E '^node_modules/?$' .gitignore`
Expected: one matching line (add it if absent).

- [ ] **Step 4: Install and run the smoke test**

Run: `npm install`
Expected: installs `core` workspace devDeps, no errors.

Run: `npm test -w core`
Expected: PASS — 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json core/package.json core/tsconfig.json core/vitest.config.ts core/test/smoke.test.ts .gitignore
git commit -m "Scaffold core engine workspace and toolchain"
```

---

## Task 2: Schema types

**Files:**
- Create: `core/src/schema/index.ts`

- [ ] **Step 1: Write the schema**

Create `core/src/schema/index.ts`:

```ts
export type JDSource = 'paste' | 'extension' | 'url' | 'pdf';

export interface JDSections {
  responsibilities?: string;
  requirements?: string;
  niceToHave?: string;
  about?: string;
  comp?: string;
}

export interface CanonicalJD {
  id: string;
  source: JDSource;
  sourceUrl?: string;
  title: string;
  company?: string;
  location?: string;
  sections: JDSections;
  raw: string;
  capturedAt: string; // ISO date, YYYY-MM-DD
}

export type SkillBucket = 'required' | 'nice' | 'unknown';

export interface SkillTag {
  canonical: string; // taxonomy key, e.g. "kubernetes"
  surface: string;   // how it appeared, e.g. "k8s"
  bucket: SkillBucket;
}

export interface CompRange {
  min?: number;
  max?: number;
  currency: string;
  equity: boolean;
  period: 'year' | 'hour' | 'unknown';
}

export interface JDRecord {
  jd: CanonicalJD;
  tags: SkillTag[];
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -p core/tsconfig.json --noEmit`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add core/src/schema/index.ts
git commit -m "Add engine schema types"
```

---

## Task 3: Stable JD id hashing

**Files:**
- Create: `core/src/util/hash.ts`
- Test: `core/test/hash.test.ts`

- [ ] **Step 1: Write the failing test**

Create `core/test/hash.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { jdId } from '../src/util/hash.js';

describe('jdId', () => {
  it('is stable for the same inputs', () => {
    const a = jdId('Acme', 'Backend Engineer', 'raw text');
    const b = jdId('Acme', 'Backend Engineer', 'raw text');
    expect(a).toBe(b);
  });

  it('is case- and whitespace-insensitive for company/title', () => {
    const a = jdId('Acme', 'Backend Engineer', 'raw text');
    const b = jdId('  acme ', ' backend engineer ', 'raw text');
    expect(a).toBe(b);
  });

  it('changes when raw body changes', () => {
    const a = jdId('Acme', 'Backend Engineer', 'raw text one');
    const b = jdId('Acme', 'Backend Engineer', 'raw text two');
    expect(a).not.toBe(b);
  });

  it('returns a 16-char hex string', () => {
    expect(jdId(undefined, 'X', 'y')).toMatch(/^[0-9a-f]{16}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w core -- hash`
Expected: FAIL — cannot find module `../src/util/hash.js`.

- [ ] **Step 3: Write the implementation**

Create `core/src/util/hash.ts`:

```ts
import { createHash } from 'node:crypto';

export function jdId(company: string | undefined, title: string, raw: string): string {
  const key = [
    (company ?? '').trim().toLowerCase(),
    title.trim().toLowerCase(),
    raw.trim(),
  ].join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w core -- hash`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add core/src/util/hash.ts core/test/hash.test.ts
git commit -m "Add stable JD id hashing"
```

---

## Task 4: Ingest — split and normalize

**Files:**
- Create: `core/src/ingest/index.ts`
- Test: `core/test/ingest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `core/test/ingest.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { splitJDs, normalize } from '../src/ingest/index.js';

const SAMPLE = `Senior Backend Engineer
Company: Acme Corp
Remote (US)

Responsibilities
Build and operate payment services.

Requirements
5+ years with Java and Spring. Strong SQL.

Nice to have
Exposure to Kafka.`;

describe('splitJDs', () => {
  it('splits on the ---NEW JOB--- marker and trims', () => {
    const out = splitJDs('one\n---NEW JOB---\ntwo');
    expect(out).toEqual(['one', 'two']);
  });

  it('drops empty segments', () => {
    const out = splitJDs('only\n---NEW JOB---\n   \n');
    expect(out).toEqual(['only']);
  });

  it('returns a single segment when no marker', () => {
    expect(splitJDs('just one')).toEqual(['just one']);
  });
});

describe('normalize', () => {
  it('extracts title from the first non-empty line', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.title).toBe('Senior Backend Engineer');
  });

  it('extracts company from a Company: line', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.company).toBe('Acme Corp');
  });

  it('detects the requirements and niceToHave sections', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.sections.requirements).toContain('Java and Spring');
    expect(jd.sections.niceToHave).toContain('Kafka');
  });

  it('retains the raw body and sets source + a date id', () => {
    const jd = normalize(SAMPLE, 'paste');
    expect(jd.source).toBe('paste');
    expect(jd.raw).toContain('payment services');
    expect(jd.id).toMatch(/^[0-9a-f]{16}$/);
    expect(jd.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w core -- ingest`
Expected: FAIL — cannot find module `../src/ingest/index.js`.

- [ ] **Step 3: Write the implementation**

Create `core/src/ingest/index.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w core -- ingest`
Expected: PASS — all ingest tests.

- [ ] **Step 5: Commit**

```bash
git add core/src/ingest/index.ts core/test/ingest.test.ts
git commit -m "Add JD ingest: split and normalize"
```

---

## Task 5: Taxonomy — vocabulary and tagging

**Files:**
- Create: `core/src/taxonomy/vocab.ts`
- Create: `core/src/taxonomy/tag.ts`
- Test: `core/test/taxonomy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `core/test/taxonomy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalize } from '../src/ingest/index.js';
import { tag } from '../src/taxonomy/tag.js';
import { SkillTag } from '../src/schema/index.js';

function bucketOf(tags: SkillTag[], canonical: string): string | undefined {
  return tags.find((t) => t.canonical === canonical)?.bucket;
}

const JD = `Backend Engineer
Requirements
Strong Java and Spring Boot. Comfortable with K8s in production.
Nice to have
GraphQL experience.`;

describe('tag', () => {
  it('tags requirements skills as required', () => {
    const tags = tag(normalize(JD, 'paste'));
    expect(bucketOf(tags, 'java')).toBe('required');
    expect(bucketOf(tags, 'spring')).toBe('required');
  });

  it('resolves aliases to canonical keys (k8s -> kubernetes)', () => {
    const tags = tag(normalize(JD, 'paste'));
    expect(bucketOf(tags, 'kubernetes')).toBe('required');
  });

  it('tags nice-to-have skills as nice', () => {
    const tags = tag(normalize(JD, 'paste'));
    expect(bucketOf(tags, 'graphql')).toBe('nice');
  });

  it('does not match substrings inside other words', () => {
    const jd = normalize('Engineer\nRequirements\nWe value javascripting skills and gocarts.', 'paste');
    const tags = tag(jd);
    // "javascripting" must not match "javascript"; "gocarts" must not match "go"
    expect(tags.find((t) => t.canonical === 'javascript')).toBeUndefined();
    expect(tags.find((t) => t.canonical === 'go')).toBeUndefined();
  });

  it('promotes a skill to required if it appears in both buckets', () => {
    const jd = normalize('Engineer\nRequirements\nJava required.\nNice to have\nJava certs.', 'paste');
    expect(bucketOf(tag(jd), 'java')).toBe('required');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w core -- taxonomy`
Expected: FAIL — cannot find module `../src/taxonomy/tag.js`.

- [ ] **Step 3: Write the vocabulary**

Create `core/src/taxonomy/vocab.ts`:

```ts
export type VocabCategory =
  | 'language'
  | 'framework'
  | 'tool'
  | 'infra'
  | 'methodology'
  | 'concept';

export interface VocabEntry {
  canonical: string;
  category: VocabCategory;
  aliases: string[]; // lowercase; include the canonical surface form
}

// Seed vocabulary. Grow this from user/data/stack-tracker.md over time;
// every addition is guarded by the eval harness.
export const VOCAB: VocabEntry[] = [
  { canonical: 'typescript', category: 'language', aliases: ['typescript', 'ts'] },
  { canonical: 'javascript', category: 'language', aliases: ['javascript', 'js', 'ecmascript'] },
  { canonical: 'python', category: 'language', aliases: ['python', 'py'] },
  { canonical: 'java', category: 'language', aliases: ['java'] },
  { canonical: 'go', category: 'language', aliases: ['golang', 'go'] },
  { canonical: 'csharp', category: 'language', aliases: ['c#', 'csharp', '.net'] },
  { canonical: 'sql', category: 'language', aliases: ['sql'] },
  { canonical: 'react', category: 'framework', aliases: ['react', 'react.js', 'reactjs'] },
  { canonical: 'angular', category: 'framework', aliases: ['angular', 'angularjs'] },
  { canonical: 'node', category: 'framework', aliases: ['node', 'node.js', 'nodejs'] },
  { canonical: 'spring', category: 'framework', aliases: ['spring', 'spring boot', 'springboot'] },
  { canonical: 'django', category: 'framework', aliases: ['django'] },
  { canonical: 'kubernetes', category: 'infra', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'docker', category: 'infra', aliases: ['docker'] },
  { canonical: 'aws', category: 'infra', aliases: ['aws', 'amazon web services'] },
  { canonical: 'gcp', category: 'infra', aliases: ['gcp', 'google cloud'] },
  { canonical: 'kafka', category: 'infra', aliases: ['kafka', 'apache kafka'] },
  { canonical: 'terraform', category: 'infra', aliases: ['terraform'] },
  { canonical: 'postgresql', category: 'tool', aliases: ['postgresql', 'postgres', 'psql'] },
  { canonical: 'mongodb', category: 'tool', aliases: ['mongodb', 'mongo'] },
  { canonical: 'redis', category: 'tool', aliases: ['redis'] },
  { canonical: 'graphql', category: 'tool', aliases: ['graphql'] },
  { canonical: 'git', category: 'tool', aliases: ['git'] },
];
```

- [ ] **Step 4: Write the tagger**

Create `core/src/taxonomy/tag.ts`:

```ts
import { CanonicalJD, SkillBucket, SkillTag } from '../schema/index.js';
import { VOCAB } from './vocab.js';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match an alias only on token boundaries so "go" doesn't match "gocarts"
// and "javascript" doesn't match "javascripting". Letters, digits and "."
// count as word characters here (so "node.js" / "react.js" stay intact).
function aliasRegex(alias: string): RegExp {
  return new RegExp(`(?<![\\w.#])${escapeRe(alias)}(?![\\w.])`, 'i');
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -w core -- taxonomy`
Expected: PASS — all taxonomy tests.

- [ ] **Step 6: Commit**

```bash
git add core/src/taxonomy/vocab.ts core/src/taxonomy/tag.ts core/test/taxonomy.test.ts
git commit -m "Add skill taxonomy and tagger"
```

---

## Task 6: Archive — the JSONL store

**Files:**
- Create: `core/src/archive/index.ts`
- Test: `core/test/archive.test.ts`

- [ ] **Step 1: Write the failing test**

Create `core/test/archive.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendRecord, readRecords } from '../src/archive/index.js';
import { JDRecord } from '../src/schema/index.js';

const dirs: string[] = [];
function tmpStore(): string {
  const d = mkdtempSync(join(tmpdir(), 'rolecraft-'));
  dirs.push(d);
  return join(d, 'nested', 'jds.jsonl');
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const rec = (id: string): JDRecord => ({
  jd: {
    id, source: 'paste', title: 'X', sections: {}, raw: 'r', capturedAt: '2026-06-20',
  },
  tags: [{ canonical: 'java', surface: 'Java', bucket: 'required' }],
});

describe('archive', () => {
  it('returns [] when the store does not exist', () => {
    expect(readRecords(tmpStore())).toEqual([]);
  });

  it('appends and reads back records, creating parent dirs', () => {
    const store = tmpStore();
    appendRecord(store, rec('a'));
    appendRecord(store, rec('b'));
    const out = readRecords(store);
    expect(out.map((r) => r.jd.id)).toEqual(['a', 'b']);
    expect(out[0].tags[0].canonical).toBe('java');
  });

  it('ignores blank trailing lines', () => {
    const store = tmpStore();
    appendRecord(store, rec('a'));
    expect(readRecords(store)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w core -- archive`
Expected: FAIL — cannot find module `../src/archive/index.js`.

- [ ] **Step 3: Write the implementation**

Create `core/src/archive/index.ts`:

```ts
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { JDRecord } from '../schema/index.js';

export function appendRecord(storePath: string, record: JDRecord): void {
  mkdirSync(dirname(storePath), { recursive: true });
  appendFileSync(storePath, JSON.stringify(record) + '\n', 'utf8');
}

export function readRecords(storePath: string): JDRecord[] {
  if (!existsSync(storePath)) return [];
  return readFileSync(storePath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as JDRecord);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w core -- archive`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add core/src/archive/index.ts core/test/archive.test.ts
git commit -m "Add JSONL archive store"
```

---

## Task 7: CLI — wire the pipeline

**Files:**
- Create: `core/src/cli.ts`
- Test: `core/test/cli.test.ts`

- [ ] **Step 1: Write the failing test**

Create `core/test/cli.test.ts`. It tests the pure `run()` directly and the `main()` end-to-end via a spawned process.

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../src/cli.js';
import { readRecords } from '../src/archive/index.js';

const dirs: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'rolecraft-cli-'));
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const TWO = `Engineer A
Requirements
Java and React.
---NEW JOB---
Engineer B
Requirements
Python and Docker.`;

describe('run', () => {
  it('produces one record per JD with tags', () => {
    const recs = run(TWO, 'paste');
    expect(recs).toHaveLength(2);
    expect(recs[0].tags.map((t) => t.canonical).sort()).toEqual(['java', 'react']);
    expect(recs[1].tags.map((t) => t.canonical).sort()).toEqual(['docker', 'python']);
  });
});

describe('main (spawned)', () => {
  it('reads a file, prints JSON, and appends to the store', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    writeFileSync(inbox, TWO, 'utf8');

    const out = execFileSync(
      'npx',
      ['tsx', join(process.cwd(), 'core', 'src', 'cli.ts'), 'process', inbox, '--store', store],
      { encoding: 'utf8' },
    );

    const parsed = JSON.parse(out);
    expect(parsed).toHaveLength(2);
    expect(readRecords(store)).toHaveLength(2);
  });
});
```

> Note: the spawned test assumes the working directory is the repo root (vitest's default). It invokes the CLI through `npx tsx`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w core -- cli`
Expected: FAIL — cannot find module `../src/cli.js`.

- [ ] **Step 3: Write the implementation**

Create `core/src/cli.ts`:

```ts
import { readFileSync } from 'node:fs';
import { splitJDs, normalize } from './ingest/index.js';
import { tag } from './taxonomy/tag.js';
import { appendRecord } from './archive/index.js';
import { JDRecord, JDSource } from './schema/index.js';

const DEFAULT_STORE = 'user/data/.rolecraft/jds.jsonl';

export function run(raw: string, source: JDSource = 'paste'): JDRecord[] {
  return splitJDs(raw).map((segment) => {
    const jd = normalize(segment, source);
    return { jd, tags: tag(jd) };
  });
}

function parseFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function main(argv: string[]): void {
  const [cmd, file] = argv;
  if (cmd !== 'process' || !file) {
    process.stderr.write('usage: cli process <file> [--store <path>]\n');
    process.exit(2);
  }
  const store = parseFlag(argv, '--store') ?? DEFAULT_STORE;
  const records = run(readFileSync(file, 'utf8'), 'paste');
  for (const record of records) appendRecord(store, record);
  process.stdout.write(JSON.stringify(records, null, 2) + '\n');
}

// Run main only when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cli.ts')) {
  main(process.argv.slice(2));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w core -- cli`
Expected: PASS — `run` unit test and the spawned `main` test.

- [ ] **Step 5: Run the full suite**

Run: `npm test -w core`
Expected: PASS — all tests across hash, ingest, taxonomy, archive, cli, smoke.

- [ ] **Step 6: Commit**

```bash
git add core/src/cli.ts core/test/cli.test.ts
git commit -m "Add engine CLI entry point"
```

---

## Task 8: Eval harness

**Files:**
- Create: `core/evals/score.ts`
- Create: `core/evals/run-evals.ts`
- Create: `core/evals/fixtures/backend-java.txt`
- Create: `core/evals/expected/backend-java.json`
- Create: `core/evals/fixtures/frontend-react.txt`
- Create: `core/evals/expected/frontend-react.json`
- Test: `core/test/score.test.ts`

- [ ] **Step 1: Write the failing scorer test**

Create `core/test/score.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { score } from '../evals/score.js';

describe('score', () => {
  it('is perfect when sets match', () => {
    const r = score(['java', 'react'], ['react', 'java']);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(1);
    expect(r.f1).toBe(1);
  });

  it('penalizes a false positive in precision', () => {
    const r = score(['java', 'go'], ['java']);
    expect(r.precision).toBe(0.5);
    expect(r.recall).toBe(1);
  });

  it('penalizes a miss in recall', () => {
    const r = score(['java'], ['java', 'react']);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(0.5);
  });

  it('treats two empty sets as perfect', () => {
    const r = score([], []);
    expect(r.f1).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w core -- score`
Expected: FAIL — cannot find module `../evals/score.js`.

- [ ] **Step 3: Write the scorer**

Create `core/evals/score.ts`:

```ts
export interface PR {
  precision: number;
  recall: number;
  f1: number;
}

export function score(predicted: string[], expected: string[]): PR {
  const p = new Set(predicted);
  const e = new Set(expected);
  let tp = 0;
  for (const x of p) if (e.has(x)) tp++;
  const precision = p.size ? tp / p.size : 1;
  const recall = e.size ? tp / e.size : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w core -- score`
Expected: PASS — 4 tests.

- [ ] **Step 5: Create the golden fixtures**

Create `core/evals/fixtures/backend-java.txt`:

```
Senior Backend Engineer
Company: Examplebank
Requirements
8+ years building services in Java and Spring Boot. Strong SQL and PostgreSQL.
Experience operating Kafka and Kubernetes in production.
Nice to have
GraphQL and Redis.
```

Create `core/evals/expected/backend-java.json`:

```json
{
  "required": ["java", "spring", "sql", "postgresql", "kafka", "kubernetes"],
  "nice": ["graphql", "redis"]
}
```

Create `core/evals/fixtures/frontend-react.txt`:

```
Frontend Engineer
Company: Exampleshop
Requirements
Expert in TypeScript and React. Comfortable with Node and Docker.
Nice to have
Exposure to AWS.
```

Create `core/evals/expected/frontend-react.json`:

```json
{
  "required": ["typescript", "react", "node", "docker"],
  "nice": ["aws"]
}
```

- [ ] **Step 6: Write the harness**

Create `core/evals/run-evals.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.js';
import { score, PR } from './score.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, 'fixtures');
const expectedDir = join(here, 'expected');

interface Expected {
  required: string[];
  nice: string[];
}

function avg(prs: PR[], k: keyof PR): number {
  if (prs.length === 0) return 1;
  return prs.reduce((s, p) => s + p[k], 0) / prs.length;
}

function main(): void {
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.txt'));
  const reqScores: PR[] = [];
  const niceScores: PR[] = [];

  for (const file of files) {
    const base = file.replace(/\.txt$/, '');
    const raw = readFileSync(join(fixturesDir, file), 'utf8');
    const expected = JSON.parse(
      readFileSync(join(expectedDir, `${base}.json`), 'utf8'),
    ) as Expected;

    const tags = run(raw, 'paste')[0].tags;
    const predReq = tags.filter((t) => t.bucket === 'required').map((t) => t.canonical);
    const predNice = tags.filter((t) => t.bucket === 'nice').map((t) => t.canonical);

    const rq = score(predReq, expected.required);
    const nc = score(predNice, expected.nice);
    reqScores.push(rq);
    niceScores.push(nc);

    process.stdout.write(
      `${base}: required P=${rq.precision.toFixed(2)} R=${rq.recall.toFixed(2)} | ` +
        `nice P=${nc.precision.toFixed(2)} R=${nc.recall.toFixed(2)}\n`,
    );
  }

  process.stdout.write(
    `\nMEAN required P=${avg(reqScores, 'precision').toFixed(2)} ` +
      `R=${avg(reqScores, 'recall').toFixed(2)} | ` +
      `nice P=${avg(niceScores, 'precision').toFixed(2)} ` +
      `R=${avg(niceScores, 'recall').toFixed(2)}\n`,
  );
}

main();
```

- [ ] **Step 7: Run the harness**

Run: `npm run evals -w core`
Expected: prints a per-fixture line for `backend-java` and `frontend-react`, then a `MEAN` line. Required precision/recall should be `1.00` for both fixtures (every expected skill is in the seed vocab).

- [ ] **Step 8: Commit**

```bash
git add core/evals core/test/score.test.ts
git commit -m "Add eval harness and golden fixtures"
```

---

## Task 9: Wire `process` mode to the engine

**Files:**
- Modify: `modes/process.md`

This is a documentation/prompt change, not code — there is no automated test. The mode keeps all of its existing steps; we replace the freehand extraction in steps 2 and 5 with a call to the engine and have the model reason over the engine's JSON.

- [ ] **Step 1: Add an engine step before step 2**

In `modes/process.md`, immediately after the `## 1. Collect input` section and before `## 2. Split and parse`, insert:

```markdown
## 1b. Run the deterministic engine

Before any freehand parsing, run the engine on the collected input. Write the
input to a temp file (or use the inbox path directly) and run, from the plugin
root:

```
npx --yes tsx core/src/cli.ts process <input-file>
```

The engine returns a JSON array — one object per JD — each with:

- `jd`: the canonical JD (`title`, `company`, `location`, detected `sections`, `raw`, stable `id`)
- `tags`: skills already matched against the controlled taxonomy, each with a
  `canonical` key and a `bucket` of `required` or `nice`

Use this JSON as the source of truth for company/title and for the skill list.
Do NOT re-extract skills the engine already tagged. Your job for the remaining
steps is to (a) handle anything the engine could not classify and (b) do the
reasoning the engine does not: concepts, projects, narrative.
```

- [ ] **Step 2: Replace the tech extraction in step 2**

In `## 2. Split and parse`, replace the bullet:

```
- Named technologies, each assigned a category: Languages / Frameworks / Tools / Methodologies / Infra
```

with:

```
- Named technologies: take these from the engine's `tags` (already categorized and bucketed as required/nice). Only add a technology the engine missed — when you do, note it so it can be added to `core/src/taxonomy/vocab.ts` later.
```

- [ ] **Step 3: Point step 5 at the engine tags**

At the start of `## 5. Tech stack → user/data/stack-tracker.md`, add:

```markdown
Source the technologies and their required/nice buckets from the engine's
`tags` output (step 1b), not from a fresh scan of the JD text. The engine is
authoritative for what tech appeared; you decide ranking and presentation.
```

- [ ] **Step 4: Manual verification**

Create a temp file with a sample JD and run the engine directly to confirm the mode's instructions are accurate:

```bash
printf 'Backend Engineer\nRequirements\nJava and Spring with Kafka.\nNice to have\nGraphQL.\n' > /tmp/jd.txt
npx --yes tsx core/src/cli.ts process /tmp/jd.txt --store /tmp/jds.jsonl
```

Expected: JSON with `tags` containing `java`/`spring`/`kafka` as `required` and `graphql` as `nice`. Confirm the wording in `modes/process.md` matches this shape.

- [ ] **Step 5: Commit**

```bash
git add modes/process.md
git commit -m "Wire process mode to the deterministic engine"
```

---

## Self-review notes

- **Spec coverage:** E1 scope from the spec — workspace + `ingest` + `taxonomy` + `archive` + `cli` + evals + `process` wiring — each has a task (Tasks 1, 4, 5, 6, 7, 8, 9). `schema` (Task 2) and `util/hash` (Task 3) are the supporting contract/util. `comp`/`aggregate`/`gap`/`similarity`/`render`/`extension` are explicitly out of E1 per the spec phasing.
- **Type consistency:** `CanonicalJD`, `SkillTag`, `JDRecord`, `JDSource`, `SkillBucket` are defined once in Task 2 and referenced unchanged by ingest, taxonomy, archive, cli, and evals. `run()`, `normalize()`, `splitJDs()`, `tag()`, `appendRecord()`, `readRecords()`, `score()` keep the same signatures wherever referenced.
- **Store path:** the engine default store is `user/data/.rolecraft/jds.jsonl`, inside the already-gitignored `user/` tree — no new gitignore entry needed for it.
- **No placeholders:** every code step contains complete code; every run step states the exact command and expected result.

---

## Execution

After this plan is approved, implement it task-by-task. Nothing reaches `main`
until you explicitly merge; all work stays on the `deterministic-engine` branch.
