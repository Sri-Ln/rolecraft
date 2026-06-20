import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { splitJDs, normalize } from './ingest/index.js';
import { tag } from './taxonomy/tag.js';
import { appendRecord } from './archive/index.js';
import { JDRecord, JDSource, SkillCache } from './schema/index.js';
import { loadCache, saveCache, seedFromVocab, mergeSkills } from './taxonomy/cache.js';

const DEFAULT_STORE = 'user/data/.rolecraft/jds.jsonl';
const DEFAULT_CACHE = 'user/data/.rolecraft/learned-skills.json';

export function run(raw: string, source: JDSource = 'paste', cache?: SkillCache): JDRecord[] {
  const effective = cache ?? seedFromVocab({});
  const entries = Object.values(effective);
  return splitJDs(raw).map((segment) => {
    const jd = normalize(segment, source);
    return { jd, tags: tag(jd, entries) };
  });
}

function parseFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function processCmd(argv: string[]): void {
  const file = argv[1];
  if (!file) {
    process.stderr.write('usage: cli process <file> [--store <path>] [--cache <path>]\n');
    process.exit(2);
  }
  const store = parseFlag(argv, '--store') ?? DEFAULT_STORE;
  const cachePath = parseFlag(argv, '--cache') ?? DEFAULT_CACHE;

  // The seed is a read-only matching aid: match against seed + the user's
  // cache, but only PERSIST skills actually seen. This keeps learned-skills.json
  // a true record of what this user has encountered — e.g. a lawyer's cache
  // never fills up with unused tech seeds.
  const userCache = loadCache(cachePath);
  const matchCache = seedFromVocab(userCache);
  const records = run(readFileSync(file, 'utf8'), 'paste', matchCache);
  let persisted = userCache;
  for (const record of records) {
    appendRecord(store, record);
    persisted = mergeSkills(
      persisted,
      record.tags.map((t) => ({
        canonical: t.canonical,
        surface: t.surface,
        domain: matchCache[t.canonical]?.domain,
      })),
    );
  }
  saveCache(cachePath, persisted);
  process.stdout.write(JSON.stringify(records, null, 2) + '\n');
}

function learnCmd(argv: string[]): void {
  const cachePath = parseFlag(argv, '--cache') ?? DEFAULT_CACHE;
  const skillsFile = parseFlag(argv, '--skills-file');
  if (!skillsFile) {
    process.stderr.write('usage: cli learn --skills-file <path> [--cache <path>]\n');
    process.exit(2);
  }
  const parsed = JSON.parse(readFileSync(skillsFile, 'utf8')) as unknown;
  if (!Array.isArray(parsed) || !parsed.every((s) => s && typeof s.canonical === 'string')) {
    process.stderr.write('learn: skills file must be a JSON array of { canonical, surface?, domain? }\n');
    process.exit(2);
  }
  const skills = parsed as { canonical: string; surface?: string; domain?: string }[];
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
