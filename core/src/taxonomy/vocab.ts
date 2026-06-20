export type VocabCategory =
  | 'language'
  | 'framework'
  | 'tool'
  | 'infra'
  | 'methodology'
  | 'concept';

export interface VocabEntry {
  canonical: string;
  category: VocabCategory;
  aliases: string[]; // lowercase; include the canonical surface form
}

// Seed vocabulary. Grow this from user/data/stack-tracker.md over time;
// every addition is guarded by the eval harness.
export const VOCAB: VocabEntry[] = [
  { canonical: 'typescript', category: 'language', aliases: ['typescript', 'ts'] },
  { canonical: 'javascript', category: 'language', aliases: ['javascript', 'js', 'ecmascript'] },
  { canonical: 'python', category: 'language', aliases: ['python', 'py'] },
  { canonical: 'java', category: 'language', aliases: ['java'] },
  { canonical: 'go', category: 'language', aliases: ['golang', 'go'] },
  { canonical: 'csharp', category: 'language', aliases: ['c#', 'csharp', '.net'] },
  { canonical: 'sql', category: 'language', aliases: ['sql'] },
  { canonical: 'react', category: 'framework', aliases: ['react', 'react.js', 'reactjs'] },
  { canonical: 'angular', category: 'framework', aliases: ['angular', 'angularjs'] },
  { canonical: 'node', category: 'framework', aliases: ['node', 'node.js', 'nodejs'] },
  { canonical: 'spring', category: 'framework', aliases: ['spring', 'spring boot', 'springboot'] },
  { canonical: 'django', category: 'framework', aliases: ['django'] },
  { canonical: 'kubernetes', category: 'infra', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'docker', category: 'infra', aliases: ['docker'] },
  { canonical: 'aws', category: 'infra', aliases: ['aws', 'amazon web services'] },
  { canonical: 'gcp', category: 'infra', aliases: ['gcp', 'google cloud'] },
  { canonical: 'kafka', category: 'infra', aliases: ['kafka', 'apache kafka'] },
  { canonical: 'terraform', category: 'infra', aliases: ['terraform'] },
  { canonical: 'postgresql', category: 'tool', aliases: ['postgresql', 'postgres', 'psql'] },
  { canonical: 'mongodb', category: 'tool', aliases: ['mongodb', 'mongo'] },
  { canonical: 'redis', category: 'tool', aliases: ['redis'] },
  { canonical: 'graphql', category: 'tool', aliases: ['graphql'] },
  { canonical: 'git', category: 'tool', aliases: ['git'] },
];
