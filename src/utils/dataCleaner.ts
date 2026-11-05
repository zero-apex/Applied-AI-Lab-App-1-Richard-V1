export interface CleaningLogEntry {
  id: string;
  row: number;
  orderId?: string;
  field: string;
  original: string;
  cleaned: string;
  reason: string;
}

export interface CleaningReport {
  totalCleaned: number;
  entries: CleaningLogEntry[];
  summaryByField: Record<string, number>;
  mergedRegions: Record<string, string[]>; // e.g. { "West": ["west"] }
}

// Acronyms that should remain uppercase
const ACRONYMS = new Set(['EMEA', 'APAC', 'LATAM', 'NA', 'EU', 'UK', 'US', 'USA', 'XL', 'HD', '4K', 'AI', 'USB', 'B2B', 'B2C']);

// Title case a string with respect for hyphens and known acronyms
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => {
      // Check if word has hyphens (e.g., E-Commerce)
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            const upper = part.toUpperCase();
            if (ACRONYMS.has(upper)) return upper;
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }

      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function cleanRegionText(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Unknown', wasModified: true, reason: 'Empty region replaced with Unknown' };

  // 1. Trim and collapse extra whitespaces
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  let cleaned = trimmed;

  // 2. Canonical common variations
  const lower = trimmed.toLowerCase();
  if (lower === 'west' || lower === 'w' || lower === 'west region' || lower === 'w. region') {
    cleaned = 'West';
  } else if (lower === 'north' || lower === 'n' || lower === 'north region' || lower === 'n. region') {
    cleaned = 'North';
  } else if (lower === 'east' || lower === 'e' || lower === 'east region' || lower === 'e. region') {
    cleaned = 'East';
  } else if (lower === 'south' || lower === 's' || lower === 'south region' || lower === 's. region') {
    cleaned = 'South';
  } else if (lower === 'central' || lower === 'central region') {
    cleaned = 'Central';
  } else {
    // General Title Casing
    cleaned = toTitleCase(trimmed);
  }

  const wasModified = raw !== cleaned;
  let reason = '';
  if (wasModified) {
    if (raw.toLowerCase() === cleaned.toLowerCase() && raw !== cleaned) {
      reason = `Case normalization ('${raw}' → '${cleaned}')`;
    } else if (raw.trim() !== raw) {
      reason = `Whitespace trimming`;
    } else {
      reason = `Standardized to canonical region name`;
    }
  }

  return { cleaned, wasModified, reason };
}

export function cleanChannelText(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Direct', wasModified: true, reason: 'Empty channel defaulted to Direct' };

  const trimmed = raw.trim().replace(/\s+/g, ' ');
  let cleaned = trimmed;
  const lower = trimmed.toLowerCase();

  if (lower === 'online' || lower === 'ecom' || lower === 'ecommerce' || lower === 'e-commerce') {
    cleaned = 'Online';
  } else if (lower === 'partner' || lower === 'partners' || lower === 'distributor') {
    cleaned = 'Partner';
  } else if (lower === 'retail' || lower === 'store' || lower === 'retail store') {
    cleaned = 'Retail';
  } else if (lower === 'direct' || lower === 'direct sales') {
    cleaned = 'Direct';
  } else if (lower === 'wholesale') {
    cleaned = 'Wholesale';
  } else {
    cleaned = toTitleCase(trimmed);
  }

  const wasModified = raw !== cleaned;
  let reason = '';
  if (wasModified) {
    reason = `Channel casing/alias standardization ('${raw}' → '${cleaned}')`;
  }

  return { cleaned, wasModified, reason };
}

export function cleanProductText(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Unknown Product', wasModified: true, reason: 'Empty product name' };

  // Trim and collapse multiple spaces
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const cleaned = toTitleCase(trimmed);

  const wasModified = raw !== cleaned;
  let reason = '';
  if (wasModified) {
    reason = `Product name formatting ('${raw}' → '${cleaned}')`;
  }

  return { cleaned, wasModified, reason };
}
