/**
 * Forever Fields - Memorial Helper Utilities
 * Functions for calculating age, formatting memorial data, and other memorial-related helpers
 */

/**
 * Calculate age from birth and death dates
 * Returns age in years, handling edge cases gracefully
 */
export function calculateAge(birthDate: Date | string | null | undefined, deathDate: Date | string | null | undefined): number | null {
  if (!birthDate || !deathDate) {
    return null;
  }

  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const death = typeof deathDate === 'string' ? new Date(deathDate) : deathDate;

    // Validate dates
    if (isNaN(birth.getTime()) || isNaN(death.getTime())) {
      return null;
    }

    // Death date must be after birth date
    if (death < birth) {
      return null;
    }

    // Calculate age
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();

    // Adjust if birthday hasn't occurred yet in the death year
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch (error) {
    console.error('[MemorialHelpers] Error calculating age:', error);
    return null;
  }
}

/**
 * Format age for display
 * Returns human-readable age string like "Lived 88 years" or "88 years young"
 */
export function formatAge(age: number | null, isPet: boolean = false): string | null {
  if (age === null || age === undefined) {
    return null;
  }

  if (age === 0) {
    return isPet ? 'Less than a year' : 'Less than a year old';
  }

  if (age === 1) {
    return isPet ? '1 year young' : 'Lived 1 year';
  }

  // For pets, use "years young" for a lighter tone
  if (isPet) {
    return `${age} years young`;
  }

  // For humans, use "Lived X years"
  return `Lived ${age} years`;
}

/**
 * Get pronouns display text
 * Returns formatted pronouns or defaults based on gender
 */
export function getPronounsDisplay(gender: string | null | undefined, customPronouns: string | null | undefined): string | null {
  // If custom pronouns provided, use them
  if (customPronouns && customPronouns.trim()) {
    return customPronouns.trim();
  }

  // If no custom pronouns, derive from gender
  if (!gender || gender === 'Prefer not to say' || gender === 'Other') {
    return null;
  }

  const pronounMap: Record<string, string> = {
    'Male': 'he/him',
    'Female': 'she/her',
    'Non-Binary': 'they/them',
  };

  return pronounMap[gender] || null;
}

/**
 * Format resting location for display
 * Returns human-readable location string
 */
export function formatRestingLocation(
  restingType: string | null | undefined,
  restingLocation: any | null | undefined
): string | null {
  if (!restingType || restingType === 'prefer_not_to_say') {
    return null;
  }

  switch (restingType) {
    case 'buried':
      if (restingLocation?.name) {
        return `Buried at ${restingLocation.name}`;
      }
      if (restingLocation?.address) {
        return `Buried at ${restingLocation.address}`;
      }
      return 'Buried at cemetery';

    case 'cremated_home':
      return 'Cremated, remains kept at home';

    case 'cremated_scattered':
      if (restingLocation?.name) {
        return `Ashes scattered at ${restingLocation.name}`;
      }
      if (restingLocation?.address) {
        return `Ashes scattered at ${restingLocation.address}`;
      }
      return 'Ashes scattered';

    default:
      return null;
  }
}

/**
 * Validate resting location data completeness
 * Ensures location has required fields based on resting type
 */
export function validateRestingLocationData(
  restingType: string | null | undefined,
  restingLocation: any | null | undefined
): { valid: boolean; message?: string } {
  if (!restingType || restingType === 'prefer_not_to_say') {
    return { valid: true };
  }

  // cremated_home doesn't require location data
  if (restingType === 'cremated_home') {
    return { valid: true };
  }

  // buried and cremated_scattered should have at least name or address
  if (restingType === 'buried' || restingType === 'cremated_scattered') {
    if (!restingLocation) {
      return {
        valid: false,
        message: `Please provide a location name or address for ${restingType === 'buried' ? 'burial site' : 'scattered ashes'}`,
      };
    }

    if (!restingLocation.name && !restingLocation.address) {
      return {
        valid: false,
        message: 'Please provide at least a location name or address',
      };
    }
  }

  return { valid: true };
}

/**
 * Calculate years since death (for "X years ago" displays)
 */
export function yearsSinceDeath(deathDate: Date | string | null | undefined): number | null {
  if (!deathDate) {
    return null;
  }

  try {
    const death = typeof deathDate === 'string' ? new Date(deathDate) : deathDate;

    if (isNaN(death.getTime())) {
      return null;
    }

    const now = new Date();
    let years = now.getFullYear() - death.getFullYear();
    const monthDiff = now.getMonth() - death.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < death.getDate())) {
      years--;
    }

    return years >= 0 ? years : null;
  } catch (error) {
    console.error('[MemorialHelpers] Error calculating years since death:', error);
    return null;
  }
}

/**
 * Format years since death for display
 */
export function formatYearsSinceDeath(years: number | null): string | null {
  if (years === null || years === undefined) {
    return null;
  }

  if (years === 0) {
    return 'This year';
  }

  if (years === 1) {
    return '1 year ago';
  }

  return `${years} years ago`;
}
