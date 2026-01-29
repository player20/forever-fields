/**
 * Duplicate Memorial Detection
 *
 * Fuzzy matching algorithm to find potential duplicate memorials
 * before allowing users to create new ones.
 */

// Levenshtein distance for fuzzy string matching
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Calculate similarity score (0-1, where 1 is identical)
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

// Normalize name for matching (handle common variations)
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '') // Remove non-letters
    .replace(/\s+/g, ' ')      // Normalize spaces
    .replace(/\b(jr|sr|iii|ii|iv)\b/gi, '') // Remove suffixes
    .trim();
}

// Parse date string to comparable format
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Check if dates match (with some tolerance for typos)
export function datesMatch(
  date1: string | Date | null | undefined,
  date2: string | Date | null | undefined,
  toleranceDays: number = 0
): boolean {
  const d1 = date1 instanceof Date ? date1 : parseDate(date1 as string);
  const d2 = date2 instanceof Date ? date2 : parseDate(date2 as string);

  if (!d1 || !d2) return false;

  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= toleranceDays;
}

// Generate canonical hash for quick duplicate lookup
export function generateCanonicalHash(
  firstName: string,
  lastName: string,
  birthDate?: string | null,
  deathDate?: string | null
): string {
  const normalizedFirst = normalizeName(firstName);
  const normalizedLast = normalizeName(lastName);
  const birth = birthDate ? new Date(birthDate).toISOString().split('T')[0] : '';
  const death = deathDate ? new Date(deathDate).toISOString().split('T')[0] : '';

  // Create a simple hash from the components
  const combined = `${normalizedFirst}|${normalizedLast}|${birth}|${death}`;

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

// Memorial data for comparison
export interface MemorialCandidate {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  nickname?: string | null;
  birthDate?: string | Date | null;
  deathDate?: string | Date | null;
  birthPlace?: string | null;
  restingPlace?: string | null;
  profilePhotoUrl?: string | null;
  slug?: string;
  viewCount?: number;
}

// Match result with confidence score
export interface DuplicateMatch {
  memorial: MemorialCandidate;
  confidence: number; // 0-1
  matchReasons: string[];
}

// Scoring weights for different fields
const WEIGHTS = {
  firstName: 0.25,
  lastName: 0.25,
  birthDate: 0.2,
  deathDate: 0.2,
  birthPlace: 0.05,
  restingPlace: 0.05,
};

// Calculate overall match score between two memorials
export function calculateMatchScore(
  input: MemorialCandidate,
  existing: MemorialCandidate
): DuplicateMatch {
  let totalScore = 0;
  const matchReasons: string[] = [];

  // First name match
  const firstNameScore = stringSimilarity(
    normalizeName(input.firstName),
    normalizeName(existing.firstName)
  );
  totalScore += firstNameScore * WEIGHTS.firstName;
  if (firstNameScore > 0.8) {
    matchReasons.push(`First name: ${existing.firstName}`);
  }

  // Last name match
  const lastNameScore = stringSimilarity(
    normalizeName(input.lastName),
    normalizeName(existing.lastName)
  );
  totalScore += lastNameScore * WEIGHTS.lastName;
  if (lastNameScore > 0.8) {
    matchReasons.push(`Last name: ${existing.lastName}`);
  }

  // Birth date match (exact match required for high score)
  if (input.birthDate && existing.birthDate) {
    if (datesMatch(input.birthDate, existing.birthDate, 0)) {
      totalScore += WEIGHTS.birthDate;
      matchReasons.push('Same birth date');
    } else if (datesMatch(input.birthDate, existing.birthDate, 365)) {
      // Same year
      totalScore += WEIGHTS.birthDate * 0.5;
      matchReasons.push('Similar birth year');
    }
  }

  // Death date match
  if (input.deathDate && existing.deathDate) {
    if (datesMatch(input.deathDate, existing.deathDate, 0)) {
      totalScore += WEIGHTS.deathDate;
      matchReasons.push('Same death date');
    } else if (datesMatch(input.deathDate, existing.deathDate, 365)) {
      totalScore += WEIGHTS.deathDate * 0.5;
      matchReasons.push('Similar death year');
    }
  }

  // Birth place match (fuzzy)
  if (input.birthPlace && existing.birthPlace) {
    const birthPlaceScore = stringSimilarity(
      input.birthPlace.toLowerCase(),
      existing.birthPlace.toLowerCase()
    );
    totalScore += birthPlaceScore * WEIGHTS.birthPlace;
    if (birthPlaceScore > 0.7) {
      matchReasons.push(`Similar birth place: ${existing.birthPlace}`);
    }
  }

  // Resting place match (fuzzy)
  if (input.restingPlace && existing.restingPlace) {
    const restingPlaceScore = stringSimilarity(
      input.restingPlace.toLowerCase(),
      existing.restingPlace.toLowerCase()
    );
    totalScore += restingPlaceScore * WEIGHTS.restingPlace;
    if (restingPlaceScore > 0.7) {
      matchReasons.push(`Similar resting place: ${existing.restingPlace}`);
    }
  }

  // Bonus for nickname match
  if (input.nickname && existing.nickname) {
    const nicknameScore = stringSimilarity(
      input.nickname.toLowerCase(),
      existing.nickname.toLowerCase()
    );
    if (nicknameScore > 0.8) {
      totalScore = Math.min(1, totalScore + 0.1);
      matchReasons.push(`Same nickname: "${existing.nickname}"`);
    }
  }

  return {
    memorial: existing,
    confidence: Math.min(1, totalScore),
    matchReasons,
  };
}

// Find potential duplicates from a list of candidates
export function findPotentialDuplicates(
  input: MemorialCandidate,
  existingMemorials: MemorialCandidate[],
  minConfidence: number = 0.6
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const existing of existingMemorials) {
    // Skip if it's the same memorial (by id)
    if (input.id && input.id === existing.id) continue;

    const match = calculateMatchScore(input, existing);

    if (match.confidence >= minConfidence) {
      matches.push(match);
    }
  }

  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidence - a.confidence);
}

// Confidence level labels for UI
export function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'red' | 'yellow' | 'green';
  description: string;
} {
  if (confidence >= 0.9) {
    return {
      label: 'Very High',
      color: 'red',
      description: 'This is very likely the same person',
    };
  }
  if (confidence >= 0.75) {
    return {
      label: 'High',
      color: 'red',
      description: 'This is probably the same person',
    };
  }
  if (confidence >= 0.6) {
    return {
      label: 'Moderate',
      color: 'yellow',
      description: 'This might be the same person',
    };
  }
  return {
    label: 'Low',
    color: 'green',
    description: 'This is unlikely to be the same person',
  };
}
