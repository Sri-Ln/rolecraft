# Rolecraft — Deterministic Engine Design

**Date:** 2026-06-20
**Branch:** `deterministic-engine`
**Status:** Draft for user review
**Authors:** Sri-Ln, with Claude

---

## Purpose

Today rolecraft is an instruction set: every step of the pipeline — parsing a
JD, extracting skills, tallying tech, aggregating a dashboard — is the model
interpreting markdown at runtime. There is zero application code. That makes
rolecraft a configuration of an agent platform, not a piece of software.

This design adds a **deterministic engine**: a plain TypeScript library
(`core/`) of small, testable functions that do the mechanical work — normalize
a JD, tag skills against a controlled taxonomy, parse compensation, aggregate
stats, compute gaps and similarity, render the dashboard. The markdown modes
shrink to the genuinely fuzzy parts (study-plan narrative, project ideas,
judgment on novel terms) and reason *over the engine's structured output*.

The same `core/` library is consumed by three front-ends: the Claude Code
plugin (via a CLI), the browser extension (via direct import), and an
evaluation harness. This is the architecture impeccable uses — a deterministic
engine under a markdown skill — extended by one notch so the existing browser
extension can share the engine instead of duplicating it.

**Explicit non-goal:** this is not a rewrite. The markdown modes keep working
throughout. The engine is introduced behind the existing `process` flow one
module at a time, starting with the most-used path.

---

## Locked design decisions

Resolved during brainstorming. Not open to revision unless something
downstream forces a change.

| # | Decision | Rationale |
|---|---|---|
| 1 | Shared TypeScript core library (`core/`), not a plugin-only `scripts/` engine, not a Python service | The browser extension already exists in JS; a shared TS package means the JD parser/taxonomy is written once and imported by both plugin and extension. A Python service would split languages and force a running server on a local tool. |
| 2 | Engine has two entry points: a CLI (plugin shells out) and a library export (extension/evals import) | Mirrors impeccable's CLI-from-markdown pattern, plus in-process import for the extension. |
| 3 | No database — markdown archive stays the store | At personal-corpus scale (dozens–hundreds of JDs) the entity graph fits in memory / frontmatter. A graph or vector DB is operational weight for scale we don't have. |
| 4 | Adopt the graph *model*, not a graph *store* | Data is designed as entities + relationships + traversals in code. Swappable behind module interfaces if it ever becomes a hosted product. |
| 5 | TF-IDF for similarity first; embeddings deferred | Pure code, zero infra, ~80% of the value. Embeddings slot behind the same `similarity/` interface later. |
| 6 | Eval harness is a first-class deliverable, not an afterthought | A golden set + scorer is the single highest-signal piece — it's what distinguishes "used an LLM" from "engineered with one and measured it." |
| 7 | Monorepo workspaces (`core/`, `extension/`) at repo root | One git history; npm workspaces wire the extension's dependency on core. |
| 8 | Incremental rollout behind existing modes | `process` keeps working at every step; engine modules are introduced one at a time. |
| 9 | Extension → plugin handoff is clipboard/inbox, no server | Keeps rolecraft a local tool. A live bridge is future backlog, not a requirement. |
| 10 | The model is the fallback, not the primary, for extraction | Taxonomy matching is deterministic; the model only handles terms the taxonomy doesn't recognize and proposes additions. |

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
│   ├── taxonomy/              # canonical JD → tagged skills {required,nice,unknown}
│   │   └── vocab.ts           #   controlled vocabulary + aliases + versions
│   ├── comp/                  # "$150K–180K + eq" → {min,max,currency,equity}
│   ├── aggregate/             # all archived JDs → counts, trends, co-occurrence
│   ├── gap/                   # profile + JD → missing skills, scored
│   ├── similarity/            # this JD + archive → "where else this role exists"
│   ├── render/                # computed stats → dashboard markdown / JSON
│   ├── archive/               # read/write the user/data markdown frontmatter store
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
user/data/                     # the store — markdown + frontmatter (existing, gitignored)
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
taxonomy.tag()  ─► { required:[react,k8s], nice:[graphql], unknown:[xyz] }
comp.parse()    ─► { min, max, currency, equity }
        │
        ▼
archive.write()  →  user/data/*.md  (markdown + frontmatter)   ← the store
        │
        ├─ aggregate()  ─► top skills, trends, co-occurrence
        ├─ gap()        ─► profile vs required → what's missing, scored
        └─ similarity() ─► where else this role exists
        │
        ▼
model (markdown mode) reasons over the structured output
        └─► study plan, project ideas, judgment on the `unknown` terms
```

Everything above the last box is deterministic, tested code. The model's
responsibility shrinks to synthesis and judgment.

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
  canonical: string;          // taxonomy key, e.g. "kubernetes"
  surface: string;            // how it appeared, e.g. "K8s"
  bucket: 'required' | 'nice' | 'unknown';
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
| `taxonomy/` | `CanonicalJD` → `SkillTag[]` | Yes; model proposes additions for `unknown` | `antipatterns.mjs` registry |
| `comp/` | comp string → `CompRange` | Yes | — |
| `aggregate/` | `Archive` → stats/trends/co-occurrence | Yes | profiler/summarizer |
| `gap/` | `Profile` + `Archive` → `Gap[]` | Yes | screenshot-contrast scoring |
| `similarity/` | `CanonicalJD` + `Archive` → ranked related roles | Yes (TF-IDF) | WCAG contrast math (known formula, done right) |
| `render/` | stats → dashboard md/json | Yes | findings formatter |
| `archive/` | read/write `user/data/*.md` frontmatter | Yes | `node/file-system.mjs` |

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

---

## Phasing

Each phase keeps `process` working end-to-end. Engine modules are introduced
one at a time, behind the existing modes.

### Phase E1 — Workspace + first slice (ingest + taxonomy + evals)

**Goal:** one real JD flows paste → `CanonicalJD` → tagged skills → archive,
with the model only filling `unknown` terms. The most-used path becomes real
software.

**Files created:**

- Root `package.json` with workspaces; `core/` package scaffold + `tsconfig`
- `core/src/schema/` (types above)
- `core/src/ingest/` (paste + section detection; adapters stubbed)
- `core/src/taxonomy/` + `vocab.ts` (seed vocabulary from existing
  `user/data/stack-tracker.md` and `concepts.md`)
- `core/src/archive/` (read/write existing `user/data/*.md` frontmatter)
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
  precision/recall on skill tagging and accuracy on comp parsing. Run in CI and
  before any taxonomy change to guard against regressions.
- **Fixtures are anonymized and committed**; any personal JD content stays in
  the gitignored user layer.

---

## Data contract impact

`core/` and `extension/` are **System Layer** (tracked in git). They contain no
user-specific content — the taxonomy vocabulary is generic; golden fixtures are
anonymized. The user layer (`user/profile/`, `user/data/`) is unchanged and
remains gitignored. The engine reads/writes `user/data/*.md` but ships none of
it. This is consistent with the migration spec's decision #1 (the
"no application code" rule was already lifted to allow `scripts/`).

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

---

## Implementation order

The next step after spec approval is invoking the `writing-plans` skill to
produce a detailed Phase E1 implementation plan. Each subsequent phase gets its
own plan when the previous merges.

Nothing in `main` changes until the user explicitly merges. All work happens on
the `deterministic-engine` branch (and per-phase sub-branches if preferred).
