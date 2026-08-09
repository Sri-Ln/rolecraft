# Rolecraft — Deterministic Engine Design

**Date:** 2026-06-20
**Branch:** `deterministic-engine`
**Status:** Revised 2026-06-20 — locks in LLM-first extraction + per-user learned cache
**Authors:** Sri-Ln, with Claude

> **Revision note (2026-06-20):** The original draft made a hand-built
> controlled vocabulary the *primary* extraction path. That cannot scale —
> enumerating every skill across every domain is millions of terms. This
> revision flips extraction to **LLM-first with a per-user learned cache**: the
> model extracts skills (any domain, no list), already-seen skills are pulled
> deterministically from a gitignored per-user cache, and the deterministic
> engine's enduring job is normalization, caching, aggregation, and measurement
> — not exhaustive enumeration. Decisions #10–#15 and the "Skill extraction &
> the learned cache" section capture the change.

---

## Purpose

Today rolecraft is an instruction set: every step of the pipeline — parsing a
JD, extracting skills, tallying tech, aggregating a dashboard — is the model
interpreting markdown at runtime. There is zero application code. That makes
rolecraft a configuration of an agent platform, not a piece of software.

This design adds an **engine**: a plain TypeScript library (`core/`) of small,
testable functions around a hybrid extraction model. Skill *extraction* is
**LLM-first** — the model reads a JD and names the skills, in any domain, with
no pre-built list. Everything *around* extraction is deterministic, testable
code: normalize a JD, **canonicalize** extracted skills against a per-user
**learned cache** (so "K8s" and "Kubernetes" count as one), parse compensation,
aggregate stats, compute gaps and similarity, render the dashboard. The markdown
modes shrink to synthesis (study-plan narrative, project ideas) and reason *over
the engine's structured output*.

Why hybrid rather than a deterministic dictionary: enumerating every skill in
every field is millions of terms — unmaintainable. So the model handles the open
set, and the deterministic value is normalization, caching, aggregation, and
**measurement** (the eval harness). That is the same shape impeccable uses —
heuristics + tools + LLM reasoning, with the engineering in the pipeline and the
measurement, not an exhaustive rulebook.

The same `core/` library is consumed by three front-ends: the Claude Code plugin
(via a CLI), the browser extension (via direct import), and an evaluation
harness.

**Explicit non-goal:** this is not a rewrite. The markdown modes keep working
throughout. The engine is introduced behind the existing `process` flow one
module at a time. It is also **not** an attempt to hand-build an exhaustive
skill dictionary — see decision #10.

---

## Locked design decisions

Resolved during brainstorming. Not open to revision unless something
downstream forces a change.

| # | Decision | Rationale |
|---|---|---|
| 1 | Shared TypeScript core library (`core/`), not a plugin-only `scripts/` engine, not a Python service | The browser extension already exists in JS; a shared TS package means the JD parser/taxonomy is written once and imported by both plugin and extension. A Python service would split languages and force a running server on a local tool. |
| 2 | Engine has two entry points: a CLI (plugin shells out) and a library export (extension/evals import) | Mirrors impeccable's CLI-from-markdown pattern, plus in-process import for the extension. |
| 3 | No database — a flat JSONL file under the gitignored user layer is the store | At personal-corpus scale (dozens–hundreds of JDs) the entity graph fits in memory / flat files. A graph or vector DB is operational weight for scale we don't have. |
| 4 | Adopt the graph *model*, not a graph *store* | Data is designed as entities + relationships + traversals in code. Swappable behind module interfaces if it ever becomes a hosted product. |
| 5 | TF-IDF for similarity first; embeddings deferred | Pure code, zero infra, ~80% of the value. Embeddings slot behind the same `similarity/` interface later. |
| 6 | Eval harness is a first-class deliverable, not an afterthought | A golden set + scorer is the single highest-signal piece — it's what distinguishes "used an LLM" from "engineered with one and measured it." |
| 7 | Monorepo workspaces (`core/`, `extension/`) at repo root | One git history; npm workspaces wire the extension's dependency on core. |
| 8 | Incremental rollout behind existing modes | `process` keeps working at every step; engine modules are introduced one at a time. |
| 9 | Extension → plugin handoff is clipboard/inbox, no server | Keeps rolecraft a local tool. A live bridge is future backlog, not a requirement. |
| 10 | **LLM-first extraction; the cache is the deterministic fast-path** (reversed from the original draft) | A hand-built vocabulary cannot enumerate millions of cross-domain skills. The LLM extracts skills from any JD; skills already in the learned cache are matched deterministically (free, consistent). The seed vocab is a bootstrap, not the source of truth. |
| 11 | **The learned cache is user-specific and gitignored** | It lives at `user/data/.rolecraft/learned-skills.json`, per clone, beside the JD store. Runtime-accumulated data is user data — never committed. |
| 12 | **Git never stores runtime-accumulated data** | Git holds code + a small curated seed only. The cache grows locally and is gitignored, so there is no repo churn and no merge conflicts from skill additions. |
| 13 | **Canonicalization is required even in LLM-first** | The LLM may emit "K8s" then "Kubernetes"; without normalizing to one canonical key, counts/gaps/similarity are wrong. `taxonomy/` is repurposed as the canonicalizer + cache lookup, not a gatekeeping matcher. |
| 14 | **Cross-domain is the default: merge all domain data, never filter to one** | Real JDs mix tech + domain + soft skills. Cache and seed are merged globally; `domain` is provenance/ranking metadata, never a match filter. |
| 15 | **Multi-user, if it ever happens, uses a per-user DB — still not git** | Single-user-local today (per-clone gitignored cache). A hosted product would store per-user skills in a DB, with a reviewed promotion path to a shared catalog. |

---

## Architecture

### The engine is a library of functions

Stripped of the word "engine," `core/` is a plain TypeScript package — a box of
pure functions. Each module takes input and returns a typed object. No server,
no daemon. The same shape as any npm library, except it's about JDs.

Each module is independently understandable and testable in isolation:
`taxonomy.tag(jd)` can be called and asserted on without any of the others.
That isolation is what keeps the codebase readable as it grows.

### Module layout

```
core/                          # the TS engine (NEW, System Layer, tracked)
├── src/
│   ├── schema/                # THE TYPES: JD, Skill, Company, Profile, Archive
│   │                          #   the contract every module shares
│   ├── ingest/                # raw JD text/DOM  → canonical JD object
│   │   └── adapters/          #   per-site DOM scrapers (linkedin, greenhouse, …)
│   ├── taxonomy/              # canonicalize + cache-lookup: LLM/text → canonical SkillTags
│   │   ├── vocab.ts           #   SEED vocabulary (bootstrap, git-tracked, not exhaustive)
│   │   ├── cache.ts           #   read/write the per-user learned-skills cache (gitignored)
│   │   └── extract.ts         #   LLM-first extraction + canonicalization orchestration
│   ├── comp/                  # "$150K–180K + eq" → {min,max,currency,equity}
│   ├── aggregate/             # all archived JDs → counts, trends, co-occurrence
│   ├── gap/                   # profile + JD → missing skills, scored
│   ├── similarity/            # this JD + archive → "where else this role exists"
│   ├── render/                # computed stats → dashboard markdown / JSON
│   ├── archive/               # read/write the user/data JSONL store (JDs + tags)
│   ├── index.ts               # library exports (extension + evals import this)
│   └── cli.ts                 # CLI entry (plugin modes shell out to this)
├── evals/
│   ├── fixtures/              # golden JDs (real, anonymized)
│   ├── expected/              # hand-labeled expected extraction per fixture
│   └── run-evals.ts           # scorer: precision/recall on skills, comp accuracy
├── test/                      # unit tests per module
├── package.json
└── tsconfig.json

extension/                     # browser extension (NEW, System Layer, tracked)
├── src/
│   ├── content-script.ts      # injected into job pages
│   ├── ui/                    # floating button
│   └── adapters.ts            # re-uses core/ingest/adapters
├── manifest.json
└── package.json

scripts/                       # plugin → core CLI bridge (created here)
modes/                         # markdown, now thin over the engine (existing)
user/data/                     # gitignored user layer: JD store + learned-skills cache
└── .rolecraft/
    ├── jds.jsonl              #   processed JD records (append-only)
    └── learned-skills.json    #   per-user skill cache (LLM-grown, never committed)
```

Root `package.json` declares workspaces `["core", "extension"]` so the extension
depends on `core` via the workspace.

### One engine, three consumers

```
                   ┌──────────────────────────────────┐
                   │            core (TS)              │
                   │  ingest taxonomy comp aggregate   │
                   │     gap  similarity  render        │
                   └──────────────────────────────────┘
                     ▲             ▲              ▲
       shells out    │   imports   │   imports    │
       to CLI        │  functions  │  functions   │
              ┌──────┴────┐  ┌─────┴─────┐  ┌─────┴──────┐
              │  plugin   │  │  browser  │  │   eval     │
              │  modes    │  │ extension │  │  harness   │
              │  (.md)    │  │   (TS)    │  │   (TS)     │
              └───────────┘  └───────────┘  └────────────┘
```

This is impeccable's "deterministic engine under a markdown skill," inverted:
impeccable funnels many *inputs* into one rule set; rolecraft feeds one engine
to many *front-ends*.

### Data flow for one JD

```
[job posting in browser]
        │  extension: floating button → site adapter scrapes the JD
        ▼
ingest.normalize() ─────► canonical JD { title, company, sections, raw }
        │
        ▼
extract.skills(jd):
   1. CACHE PASS (deterministic, free):
        match JD text against learned-skills.json → known skills, bump counts
   2. LLM PASS (only for the rest):
        "extract skills here not already [cache hits]" → canonicalize
        → write new skills into learned-skills.json (per-user, gitignored)
        ▼
   ─► SkillTag[] { canonical, surface, bucket: required|nice, source: cache|llm }
comp.parse()  ─► { min, max, currency, equity }
        │
        ▼
archive.write()  →  user/data/.rolecraft/jds.jsonl   ← the store
        │
        ├─ aggregate()  ─► top skills, trends, co-occurrence
        ├─ gap()        ─► profile vs required → what's missing, scored
        └─ similarity() ─► where else this role exists
        │
        ▼
model (markdown mode) reasons over the structured output
        └─► study plan, project ideas, narrative
```

The LLM pass in extraction is the one non-deterministic step; everything else —
canonicalization, the cache, archive, aggregate, gap, similarity — is
deterministic, tested code. Over the first several JDs the cache fills with the
user's domain, so more skills become free cache hits and the LLM is consulted
only for genuinely new terms (convergence). The model's broader responsibility
shrinks to synthesis and judgment.

---

## Schema (the contract)

All modules share types defined in `core/src/schema/`. Sketch (final types
refined in the implementation plan):

```ts
interface CanonicalJD {
  id: string;                 // stable hash of company+title+raw
  source: 'paste' | 'extension' | 'url' | 'pdf';
  sourceUrl?: string;
  title: string;
  company?: string;
  location?: string;
  sections: {                 // detected, not assumed present
    responsibilities?: string;
    requirements?: string;
    niceToHave?: string;
    about?: string;
    comp?: string;
  };
  raw: string;                // original text, always retained
  capturedAt: string;         // ISO date
}

interface SkillTag {
  canonical: string;          // normalized key, e.g. "kubernetes"
  surface: string;            // how it appeared, e.g. "K8s"
  bucket: 'required' | 'nice';
  source: 'cache' | 'llm';    // provenance: deterministic cache hit vs LLM extraction
}

// The per-user learned cache (user/data/.rolecraft/learned-skills.json).
// Grown by the LLM pass; read by the deterministic cache pass.
interface SkillCacheEntry {
  canonical: string;
  aliases: string[];          // surfaces seen for this skill
  domain?: string;            // provenance / ranking only — NOT a match filter
  seen: number;               // occurrence count across this user's JDs
}

interface CompRange {
  min?: number; max?: number; currency: string;
  equity: boolean; period: 'year' | 'hour' | 'unknown';
}

interface Gap {
  skill: string; haveIt: boolean;
  demandCount: number;        // # of archived JDs wanting it
  leverage: number;           // how many target roles it unlocks
}
```

The **graph model lives here**, in code: `aggregate/` and `gap/` treat the
archive as nodes (JD, Skill, Company, Profile) and edges (`requires`,
`co-occurs`, `posts`, `has`). No graph database — traversal is plain functions
over typed objects. If a graph or vector store is ever needed, it slots behind
the `aggregate/`, `similarity/`, and `archive/` interfaces without touching the
rest of the system.

---

## Module responsibilities

| Module | Input → Output | Deterministic? | impeccable twin |
|---|---|---|---|
| `ingest/` | raw text / DOM → `CanonicalJD` | Yes (model fallback for messy free-text section detection) | 3 input backends (regex/jsdom/browser) |
| `taxonomy/` (extract + canonicalize + cache) | `CanonicalJD` → `SkillTag[]` | **Hybrid:** cache lookup deterministic; new-skill extraction is LLM | `antipatterns.mjs` registry + a learned gazetteer |
| `comp/` | comp string → `CompRange` | Yes | — |
| `aggregate/` | `Archive` → stats/trends/co-occurrence | Yes | profiler/summarizer |
| `gap/` | `Profile` + `Archive` → `Gap[]` | Yes | screenshot-contrast scoring |
| `similarity/` | `CanonicalJD` + `Archive` → ranked related roles | Yes (TF-IDF) | WCAG contrast math (known formula, done right) |
| `render/` | stats → dashboard md/json | Yes | findings formatter |
| `archive/` | read/write `user/data/.rolecraft/jds.jsonl` | Yes | `node/file-system.mjs` |

---

## Skill extraction & the learned cache

This is the heart of the revised design. Extraction is **LLM-first**, made cheap
and consistent by a **per-user learned cache**.

### The per-JD flow

```
1. CACHE PASS (deterministic, free)
   Scan the JD for skills already in the user's learned cache (alias/token
   match). These are instant hits; bump each skill's `seen` count.

2. LLM PASS (only for what the cache didn't catch)
   Ask the model: "what skills are in this JD that aren't already [cache hits]?"
   Canonicalize each (pick a canonical key + record the surface alias, deduping
   against the cache), then write new entries into the cache.

3. NORMALIZE & RETURN
   Emit SkillTag[] with required/nice buckets and source: cache|llm.
```

### Convergence

The cache starts near-empty (optionally pre-warmed by the seed vocab). The first
few JDs lean on the LLM; as the cache accumulates the user's actual skills, more
matches come free from the cache and the LLM is consulted only for new terms.
Token cost falls and consistency rises over time — the cache converges on *this
user's* domains without anyone enumerating anything.

### Storage — user-specific, gitignored, not a database

| Thing | Scope | Location | Git? | Grows? |
|---|---|---|---|---|
| Seed vocab | app-wide | `core/data/vocab/*.json` | tracked | no (curated) |
| Learned cache | **per user** | `user/data/.rolecraft/learned-skills.json` | **gitignored** | yes (LLM-grown) |

rolecraft today is a **single-user local plugin**: each install has its own
gitignored `user/` directory, isolated per clone. There is no shared state and
nothing central to track — so "thousands of JDs across hundreds of users" does
not apply, and the cache never causes repo churn.

If rolecraft ever became a **hosted multi-user product**, the rule is unchanged
(git never stores runtime data): per-user skills live in a per-user DB row, and a
*global* catalog is populated by a reviewed promotion step (so one user's typo
cannot pollute everyone). That is future backlog, not now.

### Cross-domain skills

The cache and seed are **merged globally** and matched against every JD,
regardless of which `domain` each skill came from. A fintech JD that needs both
`python` (tech) and `settlement-risk` (finance) gets both tagged, with each skill
defined once in its home domain. `domain` is provenance and optional ranking
metadata — never a filter on what may match. (One canonical key, one home entry;
dedupe-by-canonical if files ever overlap.)

---

## Extension integration

The floating-button extension becomes the **first consumer of `core/ingest/`**,
and this is where the shared-core decision pays for itself.

Flow:

1. User is on a job posting; clicks the floating button.
2. A content script grabs the JD — via a per-site adapter (DOM selectors for
   LinkedIn / Greenhouse / Lever / Workday / Indeed) or from the user's text
   selection as a fallback.
3. The extension calls **the same `ingest.normalize()` the plugin uses**
   (bundled from `core/`) → the canonical JD in the exact format rolecraft
   expects.
4. It copies that canonical format to the clipboard (or writes it to
   `user/data/inbox.md`). The user runs `/rolecraft process` and it is already
   perfectly shaped.

**Why shared-core matters here:** the requirement is "copy/paste the JD in a
neat format that rolecraft can understand." If the extension and plugin each
had their own idea of "neat format," they would drift and break. Because both
import the one `ingest/`, the format is identical *by construction* — a single
function defines it. No server is required; the clipboard/inbox handoff keeps
rolecraft a local tool. A live extension↔plugin bridge is future backlog.

---

## What we are explicitly NOT building (now)

YAGNI list, recorded so it doesn't get re-litigated:

- **No graph database (Memgraph/Neo4j).** Graph *model* in code, yes; graph
  *server*, no. Trigger to revisit: rolecraft becomes a multi-user hosted
  product with thousands of roles needing multi-hop LLM reasoning.
- **No vector store / embeddings (yet).** TF-IDF first. Embeddings slot behind
  `similarity/` when fuzzy matching needs sharpening.
- **No Python service / HTTP backend.** Local tool; the CLI + library cover it.
- **No live extension↔plugin bridge.** Clipboard/inbox handoff for v1.
- **No hand-built exhaustive skill dictionary.** The seed vocab is a small
  bootstrap; coverage comes from LLM extraction + the learned cache, optionally
  pre-warmed from an external taxonomy (ESCO/O*NET/Lightcast) later.
- **No git-tracked learned data.** The cache is gitignored user data.
- **No multi-tenant storage.** Single-user-local; a per-user DB only if it ever
  becomes a hosted product.

---

## Phasing

Each phase keeps `process` working end-to-end. Engine modules are introduced
one at a time, behind the existing modes.

### Phase E1 — Workspace + first slice (ingest + taxonomy + evals) ✅ shipped (PR #26)

**Goal:** one real JD flows paste → `CanonicalJD` → tagged skills → archive. The
most-used path becomes real software.

> **Status:** Shipped with a deterministic seed-vocabulary tagger (plus
> vocab-as-data and a CI eval gate). Under this revision, that tagger is
> **repurposed as the cache pass / canonicalizer** in Phase E1.5 — it is not
> thrown away; it becomes step 1 of the new extraction flow.

**Files created:**

- Root `package.json` with workspaces; `core/` package scaffold + `tsconfig`
- `core/src/schema/` (types above)
- `core/src/ingest/` (paste + section detection; adapters stubbed)
- `core/src/taxonomy/` + `vocab.ts` (seed vocabulary from existing
  `user/data/stack-tracker.md` and `concepts.md`)
- `core/src/archive/` (read/write the `user/data/.rolecraft/jds.jsonl` store)
- `core/src/cli.ts` (`core process <file>` → JSON)
- `core/evals/` — ~30 golden JDs, expected labels, `run-evals.ts` scorer
- `core/test/` — unit tests for ingest, taxonomy, archive
- `modes/process.md` updated to shell out to the CLI and reason over its output

**Success criteria:**

- `npm test -w core` green; `npm run evals -w core` prints precision/recall
- Paste a JD; `/rolecraft process` produces tagged skills via the engine, not
  freehand model extraction
- Skills already in the taxonomy are never mis-tagged across the golden set
  (regression-guarded by evals)

### Phase E1.5 — LLM-first extraction + learned cache

**Goal:** flip extraction from "deterministic vocab is primary" to "LLM-first
with a per-user cache." This is the architecture-defining phase of the revision.

**Files created / changed:**

- `core/src/taxonomy/cache.ts` — read/write `user/data/.rolecraft/learned-skills.json`
- `core/src/taxonomy/extract.ts` — orchestrate cache pass → LLM pass → canonicalize
- `core/src/taxonomy/tag.ts` — repurposed as the deterministic cache/alias matcher
- `core/src/taxonomy/vocab.ts` — demoted to optional seed/bootstrap for the cache
- `modes/process.md` — extraction step becomes: cache hits + LLM for the rest;
  the model writes new skills back to the cache
- `core/evals/` — extended to grade LLM extraction (see Testing strategy)

**Success criteria:**

- A JD with skills outside the seed vocab still gets them extracted (via the LLM)
  and written to the cache
- Re-processing the same JD produces the same skills with `source: cache` (no LLM
  call needed the second time)
- The cache file is created under the gitignored `user/` tree and never staged
- Canonicalization: "K8s" and "Kubernetes" across two JDs resolve to one
  `kubernetes` entry with `seen: 2`

### Phase E2 — comp + aggregate + gap

**Files created:** `core/src/comp/`, `core/src/aggregate/`, `core/src/gap/`,
tests + eval fixtures for each.

**Success criteria:**

- Comp strings parse correctly across the golden set (accuracy reported by evals)
- `aggregate()` reproduces today's dashboard counts deterministically
- `gap()` lists missing skills scored by demand × leverage; `recurate` reads it

### Phase E3 — similarity

**Files created:** `core/src/similarity/` (TF-IDF + cosine), fixtures.

**Success criteria:**

- `companies` / "where else this role exists" is backed by computed similarity
  over the archive, not freehand model recall
- Clustering of near-duplicate JDs is deterministic and tested

### Phase E4 — browser extension

**Files created:** `extension/` (manifest, content script, floating-button UI,
per-site adapters re-using `core/ingest/adapters`).

**Success criteria:**

- Floating button on a supported job board captures the JD and produces the
  same `CanonicalJD` the CLI does (byte-for-byte for the canonical fields)
- Clipboard/inbox handoff into `/rolecraft process` works end-to-end

### Phase E5 — render + thin modes

**Files created:** `core/src/render/`; modes refactored to consume engine
output rather than re-deriving stats in prose.

**Success criteria:**

- `dashboard` is rendered from `render()` output; the markdown mode only frames
  it
- Each mode's prose is demonstrably reasoning *over* engine JSON, not
  recomputing facts

---

## Testing strategy

- **Unit tests** per module (`core/test/`), pure functions, fast.
- **Eval harness** (`core/evals/`) — the headline artifact. A golden set of real
  (anonymized) JDs with hand-labeled expected extraction; `run-evals.ts` reports
  precision/recall on skill tagging and accuracy on comp parsing. Run in CI
  (gated by `EVAL_MIN`) to guard against regressions.
- **Grading non-deterministic extraction:** once extraction is LLM-first, output
  can vary run-to-run. The harness handles this by (a) scoring against the
  canonicalized result, (b) optionally sampling each fixture N times and
  reporting mean ± spread, and (c) keeping the deterministic cache-pass path
  exactly reproducible and unit-tested.
- **Fixtures are anonymized and committed**; any personal JD content stays in
  the gitignored user layer.

---

## Data contract impact

`core/` and `extension/` are **System Layer** (tracked in git). They contain no
user-specific content — the **seed** vocabulary is generic; golden fixtures are
anonymized. The user layer (`user/profile/`, `user/data/`) remains gitignored,
and now also holds the **learned-skills cache** (`user/data/.rolecraft/`), which
is user-grown runtime data and is **never committed**. The engine reads/writes
the gitignored store but ships none of it. This is consistent with the migration
spec's decision #1 (the "no application code" rule was already lifted).

---

## Future backlog

Deferred, to be filed as issues if/when triggered:

1. **Embeddings behind `similarity/`** — when TF-IDF fuzzy matching proves
   insufficient.
2. **Graph/vector store** — only if rolecraft becomes a hosted multi-user
   product at scale.
3. **Live extension↔plugin bridge** — replace clipboard/inbox handoff with a
   local message channel.
4. **More site adapters** — beyond the initial five job boards.
5. **PDF/URL ingestion adapters** — `ingest/` already has the source enum;
   add the parsers.
6. **LLM-output regression harness** — score the model's narrative layer, not
   just the deterministic engine.
7. **Pre-warm the cache from an external taxonomy** — bulk-seed from ESCO /
   O*NET / Lightcast so even first occurrences are deterministic cache hits.
8. **Per-user DB + reviewed global catalog** — only if rolecraft becomes a
   hosted multi-user product.

---

## Implementation order

The next step after spec approval is invoking the `writing-plans` skill to
produce a detailed Phase E1 implementation plan. Each subsequent phase gets its
own plan when the previous merges.

Nothing in `main` changes until the user explicitly merges. All work happens on
the `deterministic-engine` branch (and per-phase sub-branches if preferred).
