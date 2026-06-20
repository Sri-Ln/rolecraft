# Rolecraft Engine — Phase E1.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip skill extraction from "deterministic seed vocabulary is primary" to "LLM-first with a per-user learned cache." The engine gains a gitignored per-user skill cache, a deterministic cache-pass matcher, and a `learn` command to persist model-extracted skills; the seed vocabulary is demoted to a cache bootstrap.

**Architecture:** The engine does NOT call any LLM API — it stays dependency-free. The LLM pass happens in the `process` mode (Claude Code is the runtime). The engine provides: (1) `cache.ts` to load/save/seed/merge the per-user `learned-skills.json`; (2) a repurposed `tag.ts` that matches JD text against *any* entry list (the cache, or the seed) and stamps `source: 'cache'`; (3) CLI `process` (cache pass + persist) and `learn` (merge model-extracted skills) commands. Over successive JDs the cache fills with the user's domain, so more skills become free deterministic hits.

**Tech Stack:** TypeScript (ESM, NodeNext), Node 24, vitest, tsx. No new dependencies.

> **Builds on:** Phase E1 (PR #26) — `schema`, `ingest`, `taxonomy/{vocab,tag}`, `archive`, `cli`, `evals`. This phase repurposes `tag.ts` and `cli.ts` rather than replacing them.

---

## File structure

| File | Responsibility |
|---|---|
| `core/src/schema/index.ts` | Add `SkillCacheEntry`, `SkillCache`; update `SkillTag` (add `source`, drop `'unknown'` bucket). |
| `core/src/taxonomy/cache.ts` | NEW. `loadCache`/`saveCache`/`seedFromVocab`/`mergeSkills` over the per-user JSON cache. |
| `core/src/taxonomy/tag.ts` | Repurposed: `tag(jd, entries)` matches against any `{canonical,aliases}[]`, stamps `source:'cache'`. |
| `core/src/cli.ts` | `run()` becomes cache-aware; `process` seeds+loads+saves the cache; new `learn` command. |
| `core/test/cache.test.ts` | NEW. Unit tests for the cache module. |
| `core/test/taxonomy.test.ts` | Updated for the new `tag(jd, entries)` signature + `source`. |
| `core/test/archive.test.ts` | Updated: `SkillTag` literal gains `source`. |
| `core/test/cli.test.ts` | Updated: `process`+`learn` cache integration, spawned. |
| `modes/process.md` | Extraction flow: cache pass → LLM extracts the rest → persist via `learn`. |

---

## Task 1: Cache module + cache types

**Files:**
- Modify: `core/src/schema/index.ts` (add cache types only — do NOT touch `SkillTag` yet)
- Create: `core/src/taxonomy/cache.ts`
- Test: `core/test/cache.test.ts`

- [ ] **Step 1: Add the cache types to `core/src/schema/index.ts`**

Append these to the existing schema file (leave all existing types unchanged for now):
```ts
export interface SkillCacheEntry {
  canonical: string;
  aliases: string[];   // lowercase surfaces seen for this skill
  domain?: string;     // provenance / ranking only — never a match filter
  seen: number;        // occurrence count across this user's JDs
}

// Keyed by canonical. Persisted as user/data/.rolecraft/learned-skills.json.
export type SkillCache = Record<string, SkillCacheEntry>;
```

- [ ] **Step 2: Write the failing test. Create `core/test/cache.test.ts`:**
```ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCache, saveCache, seedFromVocab, mergeSkills } from '../src/taxonomy/cache.js';

const dirs: string[] = [];
function tmpPath(): string {
  const d = mkdtempSync(join(tmpdir(), 'rolecraft-cache-'));
  dirs.push(d);
  return join(d, 'nested', 'learned-skills.json');
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('loadCache / saveCache', () => {
  it('returns {} when the file does not exist', () => {
    expect(loadCache(tmpPath())).toEqual({});
  });

  it('round-trips a cache, creating parent dirs', () => {
    const p = tmpPath();
    saveCache(p, { java: { canonical: 'java', aliases: ['java'], domain: 'tech', seen: 2 } });
    expect(loadCache(p).java.seen).toBe(2);
  });
});

describe('seedFromVocab', () => {
  it('adds seed entries with seen=0 and does not overwrite existing', () => {
    const seeded = seedFromVocab({ java: { canonical: 'java', aliases: ['java'], domain: 'tech', seen: 9 } });
    expect(seeded.kubernetes.seen).toBe(0);          // newly seeded
    expect(seeded.kubernetes.aliases).toContain('k8s');
    expect(seeded.java.seen).toBe(9);                // preserved, not reset
  });
});

describe('mergeSkills', () => {
  it('creates a new entry with seen=1', () => {
    const out = mergeSkills({}, [{ canonical: 'Rust', surface: 'Rust' }]);
    expect(out.rust).toBeDefined();
    expect(out.rust.seen).toBe(1);
    expect(out.rust.aliases).toContain('rust');
  });

  it('bumps seen and adds a new surface alias for an existing entry', () => {
    const start = { kubernetes: { canonical: 'kubernetes', aliases: ['kubernetes'], domain: 'tech', seen: 1 } };
    const out = mergeSkills(start, [{ canonical: 'kubernetes', surface: 'K8s' }]);
    expect(out.kubernetes.seen).toBe(2);
    expect(out.kubernetes.aliases).toContain('k8s');
  });

  it('does not mutate the input cache', () => {
    const start = { java: { canonical: 'java', aliases: ['java'], domain: 'tech', seen: 1 } };
    mergeSkills(start, [{ canonical: 'java', surface: 'Java' }]);
    expect(start.java.seen).toBe(1); // original untouched
  });
});
```

- [ ] **Step 3: Run `npm test -w core -- cache`. Expected: FAIL (cannot find module `../src/taxonomy/cache.js`).**

- [ ] **Step 4: Implement `core/src/taxonomy/cache.ts`:**
```ts
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
```

- [ ] **Step 5: Run `npm test -w core -- cache`. Expected: PASS. Then `npm test -w core` (full suite still green) and `npx tsc -p core/tsconfig.json --noEmit` (clean).**

- [ ] **Step 6: Commit:**
```bash
git add core/src/schema/index.ts core/src/taxonomy/cache.ts core/test/cache.test.ts
git commit -m "Add per-user learned-skills cache module"
```

---

## Task 2: Repurpose the tagger to match against any entry list

**Files:**
- Modify: `core/src/schema/index.ts` (`SkillTag`: add `source`, drop `'unknown'`)
- Modify: `core/src/taxonomy/tag.ts`
- Modify: `core/src/cli.ts` (`run()` becomes cache-aware)
- Modify: `core/test/taxonomy.test.ts`
- Modify: `core/test/archive.test.ts`

- [ ] **Step 1: Update `SkillTag` and `SkillBucket` in `core/src/schema/index.ts`.**

Replace the existing `SkillBucket`/`SkillTag` block:
```ts
export type SkillBucket = 'required' | 'nice' | 'unknown';

export interface SkillTag {
  canonical: string; // taxonomy key, e.g. "kubernetes"
  surface: string;   // how it appeared, e.g. "k8s"
  bucket: SkillBucket;
}
```
with:
```ts
export type SkillBucket = 'required' | 'nice';
export type SkillSource = 'cache' | 'llm';

export interface SkillTag {
  canonical: string;  // normalized key, e.g. "kubernetes"
  surface: string;    // how it appeared, e.g. "k8s"
  bucket: SkillBucket;
  source: SkillSource;
}
```

- [ ] **Step 2: Update the taxonomy test for the new signature. In `core/test/taxonomy.test.ts`:**

Change the import line to also import `VOCAB`, and pass it to `tag`. Replace the existing import block top:
```ts
import { describe, it, expect } from 'vitest';
import { normalize } from '../src/ingest/index.js';
import { tag } from '../src/taxonomy/tag.js';
import { SkillTag } from '../src/schema/index.js';
```
with:
```ts
import { describe, it, expect } from 'vitest';
import { normalize } from '../src/ingest/index.js';
import { tag } from '../src/taxonomy/tag.js';
import { VOCAB } from '../src/taxonomy/vocab.js';
import { SkillTag } from '../src/schema/index.js';
```
Then replace every call `tag(normalize(...))` / `tag(jd)` with `tag(normalize(...), VOCAB)` / `tag(jd, VOCAB)`. (There are 5 `tag(` call sites — update all to pass `VOCAB` as the second argument.) Finally, add this assertion as a new `it` inside the `describe('tag', ...)` block:
```ts
  it('stamps source as cache on every tag', () => {
    const tags = tag(normalize(JD, 'paste'), VOCAB);
    expect(tags.every((t) => t.source === 'cache')).toBe(true);
  });
```

- [ ] **Step 3: Run `npm test -w core -- taxonomy`. Expected: FAIL (tag takes 1 arg / source missing).**

- [ ] **Step 4: Rewrite `core/src/taxonomy/tag.ts`:**
```ts
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
```

- [ ] **Step 5: Make `run()` cache-aware in `core/src/cli.ts`.**

Add an import near the top:
```ts
import { seedFromVocab } from './taxonomy/cache.js';
import { SkillCache } from './schema/index.js';
```
Replace the existing `run` function:
```ts
export function run(raw: string, source: JDSource = 'paste'): JDRecord[] {
  return splitJDs(raw).map((segment) => {
    const jd = normalize(segment, source);
    return { jd, tags: tag(jd) };
  });
}
```
with:
```ts
export function run(raw: string, source: JDSource = 'paste', cache?: SkillCache): JDRecord[] {
  const effective = cache ?? seedFromVocab({});
  const entries = Object.values(effective);
  return splitJDs(raw).map((segment) => {
    const jd = normalize(segment, source);
    return { jd, tags: tag(jd, entries) };
  });
}
```

- [ ] **Step 6: Fix the `SkillTag` literal in `core/test/archive.test.ts`.**

Find:
```ts
  tags: [{ canonical: 'java', surface: 'Java', bucket: 'required' }],
```
and replace with:
```ts
  tags: [{ canonical: 'java', surface: 'Java', bucket: 'required', source: 'cache' }],
```

- [ ] **Step 7: Run the full suite + evals + tsc.**

- `npm test -w core` → all pass (taxonomy now passes `VOCAB`; archive literal valid; cli `run()` default-seeds from vocab so existing cli/eval expectations are unchanged).
- `npm run evals -w core` → still `MEAN required P=1.00 R=1.00 | nice P=1.00 R=1.00`.
- `npx tsc -p core/tsconfig.json --noEmit` → clean.

If any of these is not green with the code above, STOP and report BLOCKED with the exact error — do not edit tests/fixtures to force green.

- [ ] **Step 8: Commit:**
```bash
git add core/src/schema/index.ts core/src/taxonomy/tag.ts core/src/cli.ts core/test/taxonomy.test.ts core/test/archive.test.ts
git commit -m "Repurpose tagger as a cache pass over any entry list"
```

---

## Task 3: CLI cache integration + `learn` command

**Files:**
- Modify: `core/src/cli.ts`
- Test: `core/test/cli.test.ts`

- [ ] **Step 1: Add failing tests to `core/test/cli.test.ts`.**

Add these imports at the top (alongside the existing ones):
```ts
import { loadCache } from '../src/taxonomy/cache.js';
import { readFileSync as readFileSyncNode } from 'node:fs';
```
Append two new `describe` blocks at the end of the file:
```ts
describe('process (cache integration, spawned)', () => {
  it('creates+updates the learned cache and bumps seen on reprocess', () => {
    const d = tmp();
    const inbox = join(d, 'inbox.txt');
    const store = join(d, 'jds.jsonl');
    const cache = join(d, 'learned-skills.json');
    writeFileSync(inbox, 'Engineer\nRequirements\nJava and React.', 'utf8');

    const args = ['--import', 'tsx', cliPath, 'process', inbox, '--store', store, '--cache', cache];
    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: repoRoot });
    const after1 = loadCache(cache);
    expect(after1.java.seen).toBe(1);

    execFileSync(process.execPath, args, { encoding: 'utf8', cwd: repoRoot });
    const after2 = loadCache(cache);
    expect(after2.java.seen).toBe(2); // reprocess bumps the count
  });
});

describe('learn (spawned)', () => {
  it('merges model-extracted skills from a file into the cache', () => {
    const d = tmp();
    const cache = join(d, 'learned-skills.json');
    const skillsFile = join(d, 'new-skills.json');
    writeFileSync(
      skillsFile,
      JSON.stringify([{ canonical: 'settlement-risk', surface: 'settlement risk', domain: 'finance' }]),
      'utf8',
    );

    execFileSync(
      process.execPath,
      ['--import', 'tsx', cliPath, 'learn', '--cache', cache, '--skills-file', skillsFile],
      { encoding: 'utf8', cwd: repoRoot },
    );

    const out = loadCache(cache);
    expect(out['settlement-risk'].seen).toBe(1);
    expect(out['settlement-risk'].domain).toBe('finance');
  });
});
```

- [ ] **Step 2: Run `npm test -w core -- cli`. Expected: FAIL (process ignores `--cache`; `learn` is unknown → non-zero exit).**

- [ ] **Step 3: Update `core/src/cli.ts`.**

Add imports (extend the existing cache import):
```ts
import { loadCache, saveCache, seedFromVocab, mergeSkills } from './taxonomy/cache.js';
```
Add a default cache path constant next to `DEFAULT_STORE`:
```ts
const DEFAULT_CACHE = 'user/data/.rolecraft/learned-skills.json';
```
Replace the existing `main` function with this command-dispatching version:
```ts
function processCmd(argv: string[]): void {
  const file = argv[1];
  if (!file) {
    process.stderr.write('usage: cli process <file> [--store <path>] [--cache <path>]\n');
    process.exit(2);
  }
  const store = parseFlag(argv, '--store') ?? DEFAULT_STORE;
  const cachePath = parseFlag(argv, '--cache') ?? DEFAULT_CACHE;

  let cache = seedFromVocab(loadCache(cachePath));
  const records = run(readFileSync(file, 'utf8'), 'paste', cache);
  for (const record of records) {
    appendRecord(store, record);
    cache = mergeSkills(
      cache,
      record.tags.map((t) => ({ canonical: t.canonical, surface: t.surface })),
    );
  }
  saveCache(cachePath, cache);
  process.stdout.write(JSON.stringify(records, null, 2) + '\n');
}

function learnCmd(argv: string[]): void {
  const cachePath = parseFlag(argv, '--cache') ?? DEFAULT_CACHE;
  const skillsFile = parseFlag(argv, '--skills-file');
  if (!skillsFile) {
    process.stderr.write('usage: cli learn --skills-file <path> [--cache <path>]\n');
    process.exit(2);
  }
  const skills = JSON.parse(readFileSync(skillsFile, 'utf8')) as {
    canonical: string;
    surface?: string;
    domain?: string;
  }[];
  const cache = mergeSkills(loadCache(cachePath), skills);
  saveCache(cachePath, cache);
  process.stdout.write(`learned ${skills.length} skill(s); cache now has ${Object.keys(cache).length}\n`);
}

function main(argv: string[]): void {
  const cmd = argv[0];
  if (cmd === 'process') return processCmd(argv);
  if (cmd === 'learn') return learnCmd(argv);
  process.stderr.write('usage: cli <process|learn> ...\n');
  process.exit(2);
}
```
(Leave the `run`, `parseFlag`, and the bottom direct-invocation guard exactly as they are.)

- [ ] **Step 4: Run `npm test -w core -- cli`. Expected: PASS. Then `npm test -w core` (full suite) and `npm run evals -w core` (still 1.00) and `npx tsc -p core/tsconfig.json --noEmit` (clean).**

- [ ] **Step 5: Commit:**
```bash
git add core/src/cli.ts core/test/cli.test.ts
git commit -m "Add cache persistence to process and a learn command"
```

---

## Task 4: Wire the LLM-first flow into `process` mode

**Files:** Modify `modes/process.md`

Documentation/prompt change — no automated test; verify by running the CLI commands by hand. The engine does the deterministic cache pass and persistence; Claude (the mode) does the LLM extraction of skills the cache didn't catch, then persists them with `learn`.

- [ ] **Step 1: Read `modes/process.md`, then replace the `## 1b. Run the deterministic engine` section (added in E1) with this updated version:**
```markdown
## 1b. Run the engine: cache pass, then LLM extraction

Skill extraction is LLM-first, with a deterministic cache for skills already seen.

**Step A — deterministic cache pass.** Run, from the plugin root:

```
node --import tsx core/src/cli.ts process <input-file>
```

This returns a JSON array (one object per JD) with `jd` (canonical fields +
detected `sections` + `raw`) and `tags` — skills matched from the per-user
learned cache (`user/data/.rolecraft/learned-skills.json`, auto-seeded from the
shipped vocabulary on first run). Each tag has `source: "cache"`. It also bumps
each matched skill's `seen` count and persists the JD.

**Step B — LLM extraction of the rest.** Read `jd.raw` and identify every real
skill/technology/competency that is NOT already in the cache `tags`. This is your
job, not the engine's — it works for any domain (tech, finance, nursing, etc.),
so do not limit yourself to software terms. For each new skill choose a stable
lowercase `canonical` key, the `surface` form as it appeared, a `bucket`
(`required` or `nice` based on the section), and a `domain` if clear.

**Step C — persist what you learned.** Write the new skills to a temp JSON file
(array of `{canonical, surface, domain}`) and run:

```
node --import tsx core/src/cli.ts learn --skills-file <temp-file>
```

Now those skills are in the cache and will be deterministic `source: "cache"`
hits next time — the cache converges on this user's domains over time.

Use the union of Step A (cache) + Step B (LLM) skills as the source of truth for
the remaining steps. Do not re-extract skills already tagged.
```

- [ ] **Step 2: Update the step 2 bullet (added in E1) to reflect both sources. Find:**
```
- Named technologies: take these from the engine's `tags` (already categorized and bucketed as required/nice). Only add a technology the engine missed — when you do, note it so it can be added to `core/src/taxonomy/vocab.ts` later.
```
and replace with:
```
- Named technologies and skills: the union of the engine's cache `tags` (step 1b.A) and the skills you extracted (step 1b.B). New skills must be persisted with `learn` (step 1b.C) so they become cache hits next time.
```

- [ ] **Step 3: Update the step 5 paragraph (added in E1). Find:**
```
Source the technologies and their required/nice buckets from the engine's
`tags` output (step 1b), not from a fresh scan of the JD text. The engine is
authoritative for what tech appeared; you decide ranking and presentation.
```
and replace with:
```
Source the technologies and their required/nice buckets from the union of the
cache `tags` and your extracted skills (step 1b). The cache is authoritative for
already-known skills; you supply the rest. You decide ranking and presentation.
```

- [ ] **Step 4: Manual verification.** From the repo root:
```bash
printf 'Quant Developer\nRequirements\nPython and settlement risk modeling.\n' > /tmp/jd2.txt
node --import tsx core/src/cli.ts process /tmp/jd2.txt --store /tmp/jds2.jsonl --cache /tmp/cache2.json
printf '[{"canonical":"settlement-risk","surface":"settlement risk","domain":"finance"}]' > /tmp/skills2.json
node --import tsx core/src/cli.ts learn --skills-file /tmp/skills2.json --cache /tmp/cache2.json
```
Confirm: the first command tags `python` from the cache (`source: cache`) and does NOT tag "settlement risk"; after `learn`, `/tmp/cache2.json` contains a `settlement-risk` entry. Confirm the wording in `modes/process.md` matches this behavior.

- [ ] **Step 5: Commit:**
```bash
git add modes/process.md
git commit -m "Make process mode LLM-first with a learned skill cache"
```

---

## Self-review notes

- **Spec coverage (Phase E1.5):** `cache.ts` (Task 1), repurposed `tag.ts` (Task 2), `extract`/`learn` orchestration via the CLI (Task 3), `process.md` flow + seed-as-bootstrap (Tasks 2–4). The `extract.ts` file named in the spec is realized as the `processCmd` cache-pass + the mode's LLM step + `learnCmd` persistence, rather than a separate module — the LLM call lives in the mode, so a standalone `extract.ts` would only wrap the cache pass we already have. If a named module is preferred later, it is a trivial extract-method refactor.
- **Type consistency:** `SkillTag` (now with `source`) is updated in Task 2 and every literal/consumer (`archive.test.ts`, `tag.ts`, `run()`) updated in the same task. `SkillCache`/`SkillCacheEntry`/`NewSkill` defined once and reused by `cache.ts` and `cli.ts`. `tag(jd, entries)` signature is changed and all call sites (`run()`, `taxonomy.test.ts`) updated together.
- **Evals stay green** because `run()` default-seeds from `VOCAB`, so cache-pass results equal the old vocab-matching results on the golden fixtures.
- **No placeholders; no new dependencies; the engine still calls no LLM API.**

---

## Execution

Implement task-by-task on the `deterministic-engine` branch (PR #26 is still
open, so these commits extend it). Nothing reaches `main` until explicitly
merged.
