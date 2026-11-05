import { SalesOrder, CleaningReport, CleaningLogEntry } from '../types';
import { cleanRegionText, cleanChannelText, cleanProductText } from './dataCleaner';

export interface ParseResult {
  data: SalesOrder[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  cleaningReport: CleaningReport;
}

const REQUIRED_FIELDS = ['quarter', 'region', 'channel', 'product', 'units', 'discount_pct', 'revenue'];

// Map known variations of headers to canonical field names
const HEADER_ALIASES: Record<string, keyof SalesOrder> = {
  order_id: 'order_id',
  orderid: 'order_id',
  id: 'order_id',
  order_number: 'order_id',

  quarter: 'quarter',
  qtr: 'quarter',
  period: 'quarter',
  fiscal_quarter: 'quarter',

  region: 'region',
  territory: 'region',
  geo: 'region',
  geography: 'region',
  area: 'region',

  channel: 'channel',
  sales_channel: 'channel',
  distribution_channel: 'channel',

  product: 'product',
  item: 'product',
  sku: 'product',
  product_name: 'product',

  units: 'units',
  qty: 'units',
  quantity: 'units',
  volume: 'units',
  units_sold: 'units',

  discount_pct: 'discount_pct',
  discount: 'discount_pct',
  discount_rate: 'discount_pct',
  discount_percentage: 'discount_pct',
  'discount %': 'discount_pct',
  disc_pct: 'discount_pct',

  revenue: 'revenue',
  sales: 'revenue',
  amount: 'revenue',
  total_revenue: 'revenue',
  sales_amount: 'revenue',
  order_value: 'revenue',
};

// Robust CSV row splitter that respects quotes and escaped quotes
export function splitCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && nextChar === char) {
        // Escaped quote
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Clean number strings (e.g., "$1,234.50", "15%", " (200) ")
export function parseCleanNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  let str = String(val).trim();
  if (!str) return fallback;

  // Handle accounting parentheses: "(100)" -> "-100"
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.slice(1, -1);
  }

  // Remove currency signs, commas, percent sign, extra whitespace
  str = str.replace(/[$,€£¥%\s]/g, '');

  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

// Standardize quarter string to "Q1", "Q2", "Q3", "Q4"
export function normalizeQuarter(q: string): { quarter: string; modified: boolean } {
  const original = q.trim();
  const clean = original.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let quarter = 'Q1';
  if (clean.includes('Q1') || clean === '1') quarter = 'Q1';
  else if (clean.includes('Q2') || clean === '2') quarter = 'Q2';
  else if (clean.includes('Q3') || clean === '3') quarter = 'Q3';
  else if (clean.includes('Q4') || clean === '4') quarter = 'Q4';
  else quarter = clean || 'Q1';

  return { quarter, modified: original !== quarter };
}

export function parseSalesCsv(
  csvText: string,
  options: { autoClean?: boolean } = { autoClean: true }
): ParseResult {
  const autoClean = options.autoClean !== false;
  const errors: string[] = [];
  const warnings: string[] = [];
  const orders: SalesOrder[] = [];
  const cleaningEntries: CleaningLogEntry[] = [];
  const summaryByField: Record<string, number> = {};
  const mergedRegions: Record<string, string[]> = {};

  const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) {
    return {
      data: [],
      errors: ['The provided CSV file is empty.'],
      warnings: [],
      totalRows: 0,
      validRows: 0,
      cleaningReport: {
        totalCleaned: 0,
        entries: [],
        summaryByField: {},
        mergedRegions: {},
      },
    };
  }

  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = rawLines[0];
  let delimiter = ',';
  if (firstLine.includes('\t') && !firstLine.includes(',')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  }

  const rawHeaders = splitCsvLine(firstLine, delimiter).map((h) =>
    h.toLowerCase().trim().replace(/^["']|["']$/g, '').replace(/[\s_-]+/g, '_')
  );

  // Map header index to SalesOrder keys
  const headerMap: Record<number, keyof SalesOrder> = {};
  const foundFields = new Set<string>();

  rawHeaders.forEach((header, index) => {
    const matchedKey = HEADER_ALIASES[header] || HEADER_ALIASES[header.replace(/[_\s]/g, '')];
    if (matchedKey) {
      headerMap[index] = matchedKey;
      foundFields.add(matchedKey);
    }
  });

  // Verify missing required fields
  const missing = REQUIRED_FIELDS.filter((f) => !foundFields.has(f));
  if (missing.length > 0) {
    errors.push(
      `Missing required column(s): ${missing.join(', ')}. Found: ${rawHeaders.join(', ') || 'none'}. Required: quarter, region, channel, product, units, discount_pct, revenue.`
    );
    return {
      data: [],
      errors,
      warnings,
      totalRows: rawLines.length - 1,
      validRows: 0,
      cleaningReport: {
        totalCleaned: 0,
        entries: [],
        summaryByField: {},
        mergedRegions: {},
      },
    };
  }

  // Parse rows
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const cells = splitCsvLine(line, delimiter);
    const rowObj: any = {};
    const rawValues: Record<string, string> = {};

    cells.forEach((cell, idx) => {
      const field = headerMap[idx];
      if (field) {
        const rawCell = cell.replace(/^["']|["']$/g, '');
        rawValues[field] = rawCell;

        if (field === 'units' || field === 'revenue' || field === 'discount_pct') {
          let numVal = parseCleanNumber(rawCell);
          // If discount is given as whole percentage (e.g. 5 or 10 or 15 for 15%), convert to decimal if > 1
          if (field === 'discount_pct' && numVal > 1) {
            numVal = numVal / 100; // normalize 5 -> 0.05
          }
          rowObj[field] = numVal;
        } else if (field === 'quarter') {
          const { quarter, modified } = normalizeQuarter(rawCell);
          rowObj[field] = autoClean ? quarter : rawCell.trim();
          if (autoClean && modified) {
            cleaningEntries.push({
              id: `clean-${i}-quarter`,
              row: i + 1,
              orderId: rawValues.order_id || `Row ${i + 1}`,
              field: 'quarter',
              original: rawCell,
              cleaned: quarter,
              reason: `Quarter normalization ('${rawCell}' → '${quarter}')`,
            });
            summaryByField['quarter'] = (summaryByField['quarter'] || 0) + 1;
          }
        } else {
          rowObj[field] = rawCell;
        }
      }
    });

    const rawRegion = rawValues.region ?? '';
    const rawChannel = rawValues.channel ?? '';
    const rawProduct = rawValues.product ?? '';

    let cleanedRegion = rawRegion.trim();
    let cleanedChannel = rawChannel.trim();
    let cleanedProduct = rawProduct.trim();

    if (autoClean) {
      // 1. Clean Region (e.g. 'west' -> 'West')
      const regRes = cleanRegionText(rawRegion);
      cleanedRegion = regRes.cleaned;
      if (regRes.wasModified) {
        cleaningEntries.push({
          id: `clean-${i}-region`,
          row: i + 1,
          orderId: rawValues.order_id || `Row ${i + 1}`,
          field: 'region',
          original: rawRegion,
          cleaned: cleanedRegion,
          reason: regRes.reason || 'Region case/whitespace normalization',
        });
        summaryByField['region'] = (summaryByField['region'] || 0) + 1;

        if (!mergedRegions[cleanedRegion]) {
          mergedRegions[cleanedRegion] = [];
        }
        if (!mergedRegions[cleanedRegion].includes(rawRegion) && rawRegion !== cleanedRegion) {
          mergedRegions[cleanedRegion].push(rawRegion);
        }
      }

      // 2. Clean Channel (e.g. 'online' -> 'Online')
      const chanRes = cleanChannelText(rawChannel);
      cleanedChannel = chanRes.cleaned;
      if (chanRes.wasModified) {
        cleaningEntries.push({
          id: `clean-${i}-channel`,
          row: i + 1,
          orderId: rawValues.order_id || `Row ${i + 1}`,
          field: 'channel',
          original: rawChannel,
          cleaned: cleanedChannel,
          reason: chanRes.reason || 'Channel normalization',
        });
        summaryByField['channel'] = (summaryByField['channel'] || 0) + 1;
      }

      // 3. Clean Product (e.g. 'Air   Fryer  XL' -> 'Air Fryer XL')
      const prodRes = cleanProductText(rawProduct);
      cleanedProduct = prodRes.cleaned;
      if (prodRes.wasModified) {
        cleaningEntries.push({
          id: `clean-${i}-product`,
          row: i + 1,
          orderId: rawValues.order_id || `Row ${i + 1}`,
          field: 'product',
          original: rawProduct,
          cleaned: cleanedProduct,
          reason: prodRes.reason || 'Product text formatting',
        });
        summaryByField['product'] = (summaryByField['product'] || 0) + 1;
      }
    }

    // Validate row has minimum valid data
    if (
      rowObj.quarter &&
      (autoClean ? cleanedRegion : rawRegion) &&
      (autoClean ? cleanedChannel : rawChannel) &&
      (autoClean ? cleanedProduct : rawProduct) &&
      rowObj.units !== undefined &&
      rowObj.revenue !== undefined
    ) {
      orders.push({
        id: `order-${i}`,
        order_id: rawValues.order_id || `ORD-${10000 + i}`,
        quarter: rowObj.quarter,
        region: autoClean ? cleanedRegion : rawRegion,
        rawRegion: rawRegion,
        channel: autoClean ? cleanedChannel : rawChannel,
        rawChannel: rawChannel,
        product: autoClean ? cleanedProduct : rawProduct,
        rawProduct: rawProduct,
        units: Number(rowObj.units),
        discount_pct: Number(rowObj.discount_pct || 0),
        revenue: Number(rowObj.revenue),
      });
    } else {
      if (warnings.length < 5) {
        warnings.push(`Row ${i + 1} skipped due to incomplete data.`);
      }
    }
  }

  if (warnings.length >= 5) {
    warnings.push(`...and additional invalid rows were skipped.`);
  }

  return {
    data: orders,
    errors,
    warnings,
    totalRows: rawLines.length - 1,
    validRows: orders.length,
    cleaningReport: {
      totalCleaned: cleaningEntries.length,
      entries: cleaningEntries,
      summaryByField,
      mergedRegions,
    },
  };
}

export function generateCsvTemplate(): string {
  return `quarter,region,channel,product,units,discount_pct,revenue
Q1,North,Direct,Cloud Enterprise,120,0.05,240000
Q1,North,Partner,Hardware Hub,340,0.10,170000
Q1,East,Online,Analytics Suite,450,0.08,135000
Q2,North,Direct,Cloud Enterprise,140,0.05,280000
Q2,East,Direct,Cloud Enterprise,190,0.08,342000
Q2,West,Online,Hardware Hub,520,0.12,260000
Q3,North,Direct,Cloud Enterprise,185,0.05,370000
Q3,East,Partner,Analytics Suite,310,0.10,124000
Q3,West,Direct,Cloud Enterprise,390,0.05,780000
Q4,North,Direct,Cloud Enterprise,210,0.05,420000`;
}
