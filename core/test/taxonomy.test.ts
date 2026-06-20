import { describe, it, expect } from 'vitest';
import { normalize } from '../src/ingest/index.js';
import { tag } from '../src/taxonomy/tag.js';
import { SkillTag } from '../src/schema/index.js';

function bucketOf(tags: SkillTag[], canonical: string): string | undefined {
  return tags.find((t) => t.canonical === canonical)?.bucket;
}

const JD = `Backend Engineer
Requirements
Strong Java and Spring Boot. Comfortable with K8s in production.
Nice to have
GraphQL experience.`;

describe('tag', () => {
  it('tags requirements skills as required', () => {
    const tags = tag(normalize(JD, 'paste'));
    expect(bucketOf(tags, 'java')).toBe('required');
    expect(bucketOf(tags, 'spring')).toBe('required');
  });

  it('resolves aliases to canonical keys (k8s -> kubernetes)', () => {
    const tags = tag(normalize(JD, 'paste'));
    expect(bucketOf(tags, 'kubernetes')).toBe('required');
  });

  it('tags nice-to-have skills as nice', () => {
    const tags = tag(normalize(JD, 'paste'));
    expect(bucketOf(tags, 'graphql')).toBe('nice');
  });

  it('does not match substrings inside other words', () => {
    const jd = normalize('Engineer\nRequirements\nWe value javascripting skills and gocarts.', 'paste');
    const tags = tag(jd);
    expect(tags.find((t) => t.canonical === 'javascript')).toBeUndefined();
    expect(tags.find((t) => t.canonical === 'go')).toBeUndefined();
  });

  it('promotes a skill to required if it appears in both buckets', () => {
    const jd = normalize('Engineer\nRequirements\nJava required.\nNice to have\nJava certs.', 'paste');
    expect(bucketOf(tag(jd), 'java')).toBe('required');
  });
});
