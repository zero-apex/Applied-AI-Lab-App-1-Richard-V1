import { CleaningReport, CleaningLogEntry } from './utils/dataCleaner';

export interface SalesOrder {
  id?: string;
  order_id?: string;
  quarter: string; // e.g. "Q1", "Q2", "Q3", "Q4"
  region: string;
  rawRegion?: string;
  channel: string;
  rawChannel?: string;
  product: string;
  rawProduct?: string;
  units: number;
  discount_pct: number; // e.g. 0.15 or 15
  revenue: number;
}

export type { CleaningReport, CleaningLogEntry };

export interface ProductDriver {
  product: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  deltaUnits: number;
}

export interface ChannelDriver {
  channel: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  pctChange: number;
}

export interface RegionalMetric {
  region: string;
  quarterlyRevenue: Record<string, number>; // "Q1": 12000, "Q2": 15000, etc.
  quarterlyUnits: Record<string, number>;
  totalRevenue: number;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number; // Q3 - Q2
  pctChange: number; // ((Q3 - Q2) / Q2) * 100
  q2Units: number;
  q3Units: number;
  deltaUnits: number;
  avgDiscountQ2: number;
  avgDiscountQ3: number;
  productDrivers: ProductDriver[];
  channelDrivers: ChannelDriver[];
  topProductDriver?: ProductDriver;
}

export interface OverallStats {
  totalRevenue: number;
  totalOrders: number;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  pctChange: number;
  quarters: string[];
  regions: string[];
  channels: string[];
  products: string[];
}

export interface SummaryCalculationPayload {
  regionsData: RegionalMetric[];
  mostChangedAbsolute: RegionalMetric | null;
  mostChangedPercentage: RegionalMetric | null;
  overallStats: OverallStats;
}

export interface AiSummaryResponse {
  summary: string;
  sentence1: string;
  sentence2: string;
  sentence3: string;
  mostChangedRegion: string;
  citedNumbers?: string[];
  source?: 'gemini-3.8-flash' | 'calculated_rule_engine';
  note?: string;
}
