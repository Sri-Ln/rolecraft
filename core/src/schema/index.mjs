// Shared type definitions for the engine. No runtime exports — this module
// exists so every other module can reference one set of JSDoc types.

/**
 * @typedef {'paste' | 'extension' | 'url' | 'pdf'} JDSource
 */

/**
 * @typedef {object} JDSections
 * @property {string} [responsibilities]
 * @property {string} [requirements]
 * @property {string} [niceToHave]
 * @property {string} [about]
 * @property {string} [comp]
 */

/**
 * @typedef {object} CanonicalJD
 * @property {string} id
 * @property {JDSource} source
 * @property {string} [sourceUrl]
 * @property {string} title
 * @property {string} [company]
 * @property {string} [location]
 * @property {JDSections} sections
 * @property {string} raw
 * @property {string} capturedAt ISO date, YYYY-MM-DD
 */

/**
 * @typedef {'required' | 'nice'} SkillBucket
 */

/**
 * @typedef {'cache' | 'llm'} SkillSource
 */

/**
 * @typedef {object} SkillTag
 * @property {string} canonical normalized key, e.g. "kubernetes"
 * @property {string} surface how it appeared, e.g. "k8s"
 * @property {SkillBucket} bucket
 * @property {SkillSource} source
 */

/**
 * @typedef {object} CompRange
 * @property {number} [min]
 * @property {number} [max]
 * @property {string} currency
 * @property {boolean} equity
 * @property {'year' | 'hour' | 'unknown'} period
 */

/**
 * @typedef {object} JDRecord
 * @property {CanonicalJD} jd
 * @property {SkillTag[]} tags
 */

/**
 * @typedef {object} SkillCacheEntry
 * @property {string} canonical
 * @property {string[]} aliases lowercase surfaces seen for this skill
 * @property {string} [domain] provenance / ranking only — never a match filter
 * @property {number} seen occurrence count across this user's JDs
 */

/**
 * Keyed by canonical. Persisted as user/data/.rolecraft/learned-skills.json.
 * @typedef {Record<string, SkillCacheEntry>} SkillCache
 */

export {};
