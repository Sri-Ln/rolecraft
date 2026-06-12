# Mode: projects

Scoped slice: project suggestions only.

**Reads:** all sources of truth + `user/data/projects-index.md`, `user/data/concepts.md`, `user/data/stack-tracker.md`, `user/data/consolidated-jd.md` (for accumulated demand) + an optional inline JD.
**Writes:** `user/data/projects-index.md` ONLY. A JD passed here is not tracked anywhere else.

## Input

- A JD pasted with the invocation → suggest against it plus the accumulated demand.
- No JD → suggest against the accumulated demand in the trackers (consolidated-jd, concepts, stack). If the trackers are empty, say there's nothing to ground a suggestion in yet and point at `/rolecraft process`.

## When to suggest

- **Fewer than 3 JDs processed all-time → no suggestion.** Tell the user rolecraft is still accumulating signal ("2/3 JDs — patterns first, projects after") and write nothing.
- **3+ JDs → suggest from the pattern across all of them**, not the latest JD alone: pick the tech and domain concepts that cover the most demanded ground with one coherent build. The point is modeling a real business process the JDs share — understanding how the business actually works, not just exercising the tech. Never bake every technology into one demo.

## Extend vs new (decided by tech TYPE)

- Classify accumulated demand by tech type: messaging queue, cache layer, serverless functions, stream processing, relational store, front-end framework, and so on.
- Competitor swaps within a type (Angular↔React, Kafka↔Solace) are NOT new types — an existing project covering the type covers the swap; note the alternative in that project's row.
- A genuinely new type: first try fitting it into an existing project as an add-on or improvement milestone (logged under that project's heading). Open a new project only when the type can't reasonably fit the existing ones.
- Say which you chose and why.

## File format

- The Project cell in the table is an anchor link to that project's heading in the Suggestion log (e.g. `[RFQ lifecycle engine](#rfq-lifecycle-engine)`), so the summary table and the detail always map to each other.
- Every suggestion entry: the business problem it models, MVP scope, rough timeline, demanded tech exercised. Never a generic CRUD demo or to-do app.
- New projects enter the table with status `idea`. Never change the status of rows the user has touched (`building` / `done` are the user's to set).

## Report

The suggestion itself, the business problem in one sentence, and the extend-vs-new call.
