import {
  SalesOrder,
  RegionalMetric,
  ProductDriver,
  ChannelDriver,
  OverallStats,
  SummaryCalculationPayload,
} from '../types';

export function calculateRegionalAnalytics(
  orders: SalesOrder[],
  filter?: { channel?: string; product?: string }
): SummaryCalculationPayload {
  const filteredOrders = orders.filter((o) => {
    if (filter?.channel && filter.channel !== 'ALL' && o.channel !== filter.channel) return false;
    if (filter?.product && filter.product !== 'ALL' && o.product !== filter.product) return false;
    return true;
  });

  const quartersSet = new Set<string>();
  const regionsSet = new Set<string>();
  const channelsSet = new Set<string>();
  const productsSet = new Set<string>();

  // Aggregate by region
  interface RegionalAccumulator {
    quarterlyRevenue: Record<string, number>;
    quarterlyUnits: Record<string, number>;
    quarterlyDiscountWeighted: Record<string, { totalDiscountTimesRev: number; totalRev: number }>;
    products: Record<string, { q2Rev: number; q3Rev: number; q2Units: number; q3Units: number }>;
    channels: Record<string, { q2Rev: number; q3Rev: number }>;
  }

  const regionAcc: Record<string, RegionalAccumulator> = {};

  filteredOrders.forEach((o) => {
    quartersSet.add(o.quarter);
    regionsSet.add(o.region);
    channelsSet.add(o.channel);
    productsSet.add(o.product);

    if (!regionAcc[o.region]) {
      regionAcc[o.region] = {
        quarterlyRevenue: {},
        quarterlyUnits: {},
        quarterlyDiscountWeighted: {},
        products: {},
        channels: {},
      };
    }

    const reg = regionAcc[o.region];
    reg.quarterlyRevenue[o.quarter] = (reg.quarterlyRevenue[o.quarter] || 0) + o.revenue;
    reg.quarterlyUnits[o.quarter] = (reg.quarterlyUnits[o.quarter] || 0) + o.units;

    if (!reg.quarterlyDiscountWeighted[o.quarter]) {
      reg.quarterlyDiscountWeighted[o.quarter] = { totalDiscountTimesRev: 0, totalRev: 0 };
    }
    reg.quarterlyDiscountWeighted[o.quarter].totalDiscountTimesRev += o.discount_pct * o.revenue;
    reg.quarterlyDiscountWeighted[o.quarter].totalRev += o.revenue;

    // Track Q2 vs Q3 drivers
    if (o.quarter === 'Q2' || o.quarter === 'Q3') {
      if (!reg.products[o.product]) {
        reg.products[o.product] = { q2Rev: 0, q3Rev: 0, q2Units: 0, q3Units: 0 };
      }
      if (!reg.channels[o.channel]) {
        reg.channels[o.channel] = { q2Rev: 0, q3Rev: 0 };
      }

      if (o.quarter === 'Q2') {
        reg.products[o.product].q2Rev += o.revenue;
        reg.products[o.product].q2Units += o.units;
        reg.channels[o.channel].q2Rev += o.revenue;
      } else if (o.quarter === 'Q3') {
        reg.products[o.product].q3Rev += o.revenue;
        reg.products[o.product].q3Units += o.units;
        reg.channels[o.channel].q3Rev += o.revenue;
      }
    }
  });

  // Convert to RegionalMetric list
  const regionsData: RegionalMetric[] = Object.keys(regionAcc).map((region) => {
    const acc = regionAcc[region];
    const q2Revenue = acc.quarterlyRevenue['Q2'] || 0;
    const q3Revenue = acc.quarterlyRevenue['Q3'] || 0;
    const deltaRevenue = q3Revenue - q2Revenue;
    const pctChange = q2Revenue > 0 ? ((q3Revenue - q2Revenue) / q2Revenue) * 100 : (q3Revenue > 0 ? 100 : 0);

    const q2Units = acc.quarterlyUnits['Q2'] || 0;
    const q3Units = acc.quarterlyUnits['Q3'] || 0;
    const deltaUnits = q3Units - q2Units;

    const totalRevenue = Object.values(acc.quarterlyRevenue).reduce((sum, val) => sum + val, 0);

    const discQ2 = acc.quarterlyDiscountWeighted['Q2'];
    const avgDiscountQ2 = discQ2 && discQ2.totalRev > 0 ? (discQ2.totalDiscountTimesRev / discQ2.totalRev) * 100 : 0;

    const discQ3 = acc.quarterlyDiscountWeighted['Q3'];
    const avgDiscountQ3 = discQ3 && discQ3.totalRev > 0 ? (discQ3.totalDiscountTimesRev / discQ3.totalRev) * 100 : 0;

    // Product drivers
    const productDrivers: ProductDriver[] = Object.keys(acc.products).map((prod) => {
      const p = acc.products[prod];
      const pDelta = p.q3Rev - p.q2Rev;
      const pPct = p.q2Rev > 0 ? ((p.q3Rev - p.q2Rev) / p.q2Rev) * 100 : (p.q3Rev > 0 ? 100 : 0);
      return {
        product: prod,
        q2Revenue: p.q2Rev,
        q3Revenue: p.q3Rev,
        deltaRevenue: pDelta,
        pctChange: pPct,
        q2Units: p.q2Units,
        q3Units: p.q3Units,
        deltaUnits: p.q3Units - p.q2Units,
      };
    }).sort((a, b) => Math.abs(b.deltaRevenue) - Math.abs(a.deltaRevenue));

    // Channel drivers
    const channelDrivers: ChannelDriver[] = Object.keys(acc.channels).map((ch) => {
      const c = acc.channels[ch];
      const cDelta = c.q3Rev - c.q2Rev;
      const cPct = c.q2Rev > 0 ? ((c.q3Rev - c.q2Rev) / c.q2Rev) * 100 : (c.q3Rev > 0 ? 100 : 0);
      return {
        channel: ch,
        q2Revenue: c.q2Rev,
        q3Revenue: c.q3Rev,
        deltaRevenue: cDelta,
        pctChange: cPct,
      };
    }).sort((a, b) => Math.abs(b.deltaRevenue) - Math.abs(a.deltaRevenue));

    return {
      region,
      quarterlyRevenue: acc.quarterlyRevenue,
      quarterlyUnits: acc.quarterlyUnits,
      totalRevenue,
      q2Revenue,
      q3Revenue,
      deltaRevenue,
      pctChange,
      q2Units,
      q3Units,
      deltaUnits,
      avgDiscountQ2,
      avgDiscountQ3,
      productDrivers,
      channelDrivers,
      topProductDriver: productDrivers[0],
    };
  });

  // Sort regions by total revenue descending
  regionsData.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Find region that changed most from Q2 to Q3
  // 1. By absolute dollar change |Q3 - Q2|
  let mostChangedAbsolute: RegionalMetric | null = null;
  let maxAbsDelta = -1;

  // 2. By percentage change |pctChange|
  let mostChangedPercentage: RegionalMetric | null = null;
  let maxPctDelta = -1;

  regionsData.forEach((r) => {
    // Only consider regions that had activity in either Q2 or Q3
    if (r.q2Revenue > 0 || r.q3Revenue > 0) {
      const absDelta = Math.abs(r.deltaRevenue);
      if (absDelta > maxAbsDelta) {
        maxAbsDelta = absDelta;
        mostChangedAbsolute = r;
      }

      const absPct = Math.abs(r.pctChange);
      if (absPct > maxPctDelta) {
        maxPctDelta = absPct;
        mostChangedPercentage = r;
      }
    }
  });

  // Calculate Overall stats
  let totalCompanyQ2 = 0;
  let totalCompanyQ3 = 0;
  let totalAllRevenue = 0;

  regionsData.forEach((r) => {
    totalCompanyQ2 += r.q2Revenue;
    totalCompanyQ3 += r.q3Revenue;
    totalAllRevenue += r.totalRevenue;
  });

  const companyDelta = totalCompanyQ3 - totalCompanyQ2;
  const companyPctChange = totalCompanyQ2 > 0 ? (companyDelta / totalCompanyQ2) * 100 : 0;

  // Standard ordered quarters (Q1, Q2, Q3, Q4, or whatever is in dataset sorted)
  const orderedQuarters = Array.from(quartersSet).sort((a, b) => {
    const qOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    return (qOrder[a] || 99) - (qOrder[b] || 99);
  });

  const overallStats: OverallStats = {
    totalRevenue: totalAllRevenue,
    totalOrders: filteredOrders.length,
    q2Revenue: totalCompanyQ2,
    q3Revenue: totalCompanyQ3,
    deltaRevenue: companyDelta,
    pctChange: companyPctChange,
    quarters: orderedQuarters,
    regions: Array.from(regionsSet).sort(),
    channels: Array.from(channelsSet).sort(),
    products: Array.from(productsSet).sort(),
  };

  return {
    regionsData,
    mostChangedAbsolute,
    mostChangedPercentage,
    overallStats,
  };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactUSD(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}k`;
  }
  return formatUSD(amount);
}
