import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
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
// pathToFileURL normalizes drive letters and percent-encoding across platforms;
// the .endsWith fallback covers the tsx loader, where argv[1] is the .ts source.
const entry = process.argv[1];
const invokedDirectly =
  (entry !== undefined && import.meta.url === pathToFileURL(entry).href) ||
  entry?.endsWith('cli.ts') === true;
if (invokedDirectly) {
  main(process.argv.slice(2));
}
