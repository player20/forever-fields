/**
 * Cemetery Types
 *
 * Types for cemetery lookup and autocomplete functionality.
 */

export interface Cemetery {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  source: "osm" | "google" | "manual" | "familysearch" | "gps";
  osmId?: string;
  placeId?: string; // Google Places ID
}

export interface CemeterySearchResult {
  cemeteries: Cemetery[];
  query: string;
  source: string;
}

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  cemetery?: Cemetery;
  address?: string;
}

export interface CemeteryLookupOptions {
  /** Search query (cemetery name or partial) */
  query?: string;
  /** Latitude for proximity search */
  latitude?: number;
  /** Longitude for proximity search */
  longitude?: number;
  /** Search radius in kilometers */
  radiusKm?: number;
  /** Country code filter (e.g., "US", "GB") */
  countryCode?: string;
  /** State/region filter */
  state?: string;
  /** Maximum results to return */
  limit?: number;
}

// Common cemetery name patterns for validation
export const CEMETERY_KEYWORDS = [
  "cemetery",
  "memorial park",
  "memorial garden",
  "burial ground",
  "graveyard",
  "churchyard",
  "mausoleum",
  "columbarium",
  "crematorium",
  "funeral home",
  "mortuary",
  // Non-English
  "cementerio", // Spanish
  "cimetière", // French
  "friedhof", // German
  "begraafplaats", // Dutch
  "kyrkogård", // Swedish
];

// Format a cemetery for display
export function formatCemeteryDisplay(cemetery: Cemetery): string {
  const parts: string[] = [cemetery.name];

  if (cemetery.city && cemetery.state) {
    parts.push(`${cemetery.city}, ${cemetery.state}`);
  } else if (cemetery.city) {
    parts.push(cemetery.city);
  } else if (cemetery.address) {
    parts.push(cemetery.address);
  }

  return parts.join(" - ");
}

// Format a cemetery as a full address
export function formatCemeteryAddress(cemetery: Cemetery): string {
  const parts: string[] = [];

  if (cemetery.name) parts.push(cemetery.name);
  if (cemetery.address) parts.push(cemetery.address);

  const cityStateZip: string[] = [];
  if (cemetery.city) cityStateZip.push(cemetery.city);
  if (cemetery.state) cityStateZip.push(cemetery.state);
  if (cemetery.postalCode) cityStateZip.push(cemetery.postalCode);

  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(", "));
  }

  if (cemetery.country && cemetery.country !== "United States") {
    parts.push(cemetery.country);
  }

  return parts.join("\n");
}
