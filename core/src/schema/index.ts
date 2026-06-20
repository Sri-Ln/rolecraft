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

export type SkillBucket = 'required' | 'nice';
export type SkillSource = 'cache' | 'llm';

export interface SkillTag {
  canonical: string;  // normalized key, e.g. "kubernetes"
  surface: string;    // how it appeared, e.g. "k8s"
  bucket: SkillBucket;
  source: SkillSource;
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

export interface SkillCacheEntry {
  canonical: string;
  aliases: string[];   // lowercase surfaces seen for this skill
  domain?: string;     // provenance / ranking only — never a match filter
  seen: number;        // occurrence count across this user's JDs
}

// Keyed by canonical. Persisted as user/data/.rolecraft/learned-skills.json.
export type SkillCache = Record<string, SkillCacheEntry>;
