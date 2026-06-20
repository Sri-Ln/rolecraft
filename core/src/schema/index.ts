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

export type SkillBucket = 'required' | 'nice' | 'unknown';

export interface SkillTag {
  canonical: string; // taxonomy key, e.g. "kubernetes"
  surface: string;   // how it appeared, e.g. "k8s"
  bucket: SkillBucket;
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
