import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { splitJDs, normalize } from './ingest/index.mjs';
import { tag } from './taxonomy/tag.mjs';
import { appendRecord } from './archive/index.mjs';
import { loadCache, saveCache, seedFromVocab, mergeSkills } from './taxonomy/cache.mjs';

/**
 * @typedef {import('./schema/index.mjs').JDRecord} JDRecord
 * @typedef {import('./schema/index.mjs').JDSource} JDSource
 * @typedef {import('./schema/index.mjs').SkillCache} SkillCache
 */

const DEFAULT_STORE = 'user/data/.rolecraft/jds.jsonl';
const DEFAULT_CACHE = 'user/data/.rolecraft/learned-skills.json';

/**
 * @param {string} raw
 * @param {JDSource} [source]
 * @param {SkillCache} [cache]
 * @returns {JDRecord[]}
 */
export function run(raw, source = 'paste', cache) {
  const effective = cache ?? seedFromVocab({});
  const entries = Object.values(effective);
  return splitJDs(raw).map((segment) => {
    const jd = normalize(segment, source);
    return { jd, tags: tag(jd, entries) };
  });
}

/**
 * @param {string[]} argv
 * @param {string} name
 * @returns {string | undefined}
 */
function parseFlag(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

/**
 * @param {string[]} argv
 */
function processCmd(argv) {
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

/**
 * @param {string[]} argv
 */
function learnCmd(argv) {
  const cachePath = parseFlag(argv, '--cache') ?? DEFAULT_CACHE;
  const skillsFile = parseFlag(argv, '--skills-file');
  if (!skillsFile) {
    process.stderr.write('usage: cli learn --skills-file <path> [--cache <path>]\n');
    process.exit(2);
  }
  /** @type {unknown} */
  const parsed = JSON.parse(readFileSync(skillsFile, 'utf8'));
  if (!Array.isArray(parsed) || !parsed.every((s) => s && typeof s.canonical === 'string')) {
    process.stderr.write('learn: skills file must be a JSON array of { canonical, surface?, domain? }\n');
    process.exit(2);
  }
  const skills = /** @type {{ canonical: string; surface?: string; domain?: string }[]} */ (parsed);
  const cache = mergeSkills(loadCache(cachePath), skills);
  saveCache(cachePath, cache);
  process.stdout.write(`learned ${skills.length} skill(s); cache now has ${Object.keys(cache).length}\n`);
}

/**
 * @param {string[]} argv
 */
function main(argv) {
  const cmd = argv[0];
  if (cmd === 'process') return processCmd(argv);
  if (cmd === 'learn') return learnCmd(argv);
  process.stderr.write('usage: cli <process|learn> ...\n');
  process.exit(2);
}

// Run main only when invoked directly (not when imported by tests).
// pathToFileURL normalizes drive letters and percent-encoding across platforms.
const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  main(process.argv.slice(2));
}
