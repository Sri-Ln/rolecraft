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

  const meanReqP = avg(reqScores, 'precision');
  const meanReqR = avg(reqScores, 'recall');

  process.stdout.write(
    `\nMEAN required P=${meanReqP.toFixed(2)} ` +
      `R=${meanReqR.toFixed(2)} | ` +
      `nice P=${avg(niceScores, 'precision').toFixed(2)} ` +
      `R=${avg(niceScores, 'recall').toFixed(2)}\n`,
  );

  // Quality gate: fail (non-zero exit) when required precision/recall regress
  // below the threshold, so CI blocks PRs that make extraction worse.
  // Tune via the EVAL_MIN env var (default 0.9).
  const min = Number(process.env.EVAL_MIN ?? '0.9');
  if (meanReqP < min || meanReqR < min) {
    process.stderr.write(
      `\nFAIL: required extraction below threshold ${min} ` +
        `(P=${meanReqP.toFixed(2)}, R=${meanReqR.toFixed(2)})\n`,
    );
    process.exit(1);
  }
}

main();
