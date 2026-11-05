import React, { useState } from 'react';
import { RegionalMetric, OverallStats } from '../types';
import { formatUSD } from '../utils/calculations';
import {
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Download,
  Package,
  Share2,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface RevenueTableProps {
  regionsData: RegionalMetric[];
  overallStats: OverallStats;
  mostChangedRegion: string | null;
}

type SortField = 'region' | 'totalRevenue' | 'q1' | 'q2' | 'q3' | 'q4' | 'deltaRevenue' | 'pctChange';

export const RevenueTable: React.FC<RevenueTableProps> = ({
  regionsData,
  overallStats,
  mostChangedRegion,
}) => {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('deltaRevenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const quarters = overallStats.quarters.length > 0 ? overallStats.quarters : ['Q1', 'Q2', 'Q3', 'Q4'];

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'region' ? 'asc' : 'desc');
    }
  };

  const sortedData = [...regionsData].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'region':
        aVal = a.region.toLowerCase();
        bVal = b.region.toLowerCase();
        break;
      case 'totalRevenue':
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
        break;
      case 'q1':
        aVal = a.quarterlyRevenue['Q1'] || 0;
        bVal = b.quarterlyRevenue['Q1'] || 0;
        break;
      case 'q2':
        aVal = a.q2Revenue;
        bVal = b.q2Revenue;
        break;
      case 'q3':
        aVal = a.q3Revenue;
        bVal = b.q3Revenue;
        break;
      case 'q4':
        aVal = a.quarterlyRevenue['Q4'] || 0;
        bVal = b.quarterlyRevenue['Q4'] || 0;
        break;
      case 'deltaRevenue':
        aVal = Math.abs(a.deltaRevenue);
        bVal = Math.abs(b.deltaRevenue);
        break;
      case 'pctChange':
        aVal = a.pctChange;
        bVal = b.pctChange;
        break;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const exportTableToCsv = () => {
    const headers = ['Region', ...quarters, 'Total Revenue', 'Q2 Revenue', 'Q3 Revenue', 'Q2 to Q3 $ Change', 'Q2 to Q3 % Change'];
    const rows = sortedData.map((r) => [
      `"${r.region}"`,
      ...quarters.map((q) => (r.quarterlyRevenue[q] || 0).toFixed(2)),
      r.totalRevenue.toFixed(2),
      r.q2Revenue.toFixed(2),
      r.q3Revenue.toFixed(2),
      r.deltaRevenue.toFixed(2),
      `${r.pctChange.toFixed(2)}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_regional_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Regional Revenue Matrix by Quarter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive pivot showing exact dollar amounts, quarterly shift, and expandable product driver drilldowns
            </p>
          </div>
        </div>

        <button
          onClick={exportTableToCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Pivot Table
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4 w-10"></th>
              <th
                onClick={() => handleSort('region')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
              >
                <div className="flex items-center gap-1.5">
                  Region
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              {quarters.map((q) => (
                <th
                  key={q}
                  onClick={() => handleSort(q.toLowerCase() as SortField)}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {q}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              ))}
              <th
                onClick={() => handleSort('totalRevenue')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Total
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('deltaRevenue')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none bg-indigo-50/50 dark:bg-indigo-950/20"
              >
                <div className="flex items-center justify-end gap-1.5 text-indigo-700 dark:text-indigo-400">
                  Q2→Q3 Shift ($)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('pctChange')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none bg-indigo-50/50 dark:bg-indigo-950/20"
              >
                <div className="flex items-center justify-end gap-1.5 text-indigo-700 dark:text-indigo-400">
                  Q2→Q3 Shift (%)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedData.map((reg) => {
              const isExpanded = expandedRegions.has(reg.region);
              const isTopChanged = reg.region === mostChangedRegion;
              const isPositiveDelta = reg.deltaRevenue >= 0;

              return (
                <React.Fragment key={reg.region}>
                  <tr
                    onClick={() => toggleRegion(reg.region)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                      isTopChanged ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{reg.region}</span>
                        {isTopChanged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                            Most Changed
                          </span>
                        )}
                      </div>
                    </td>

                    {quarters.map((q) => {
                      const rev = reg.quarterlyRevenue[q] || 0;
                      return (
                        <td key={q} className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatUSD(rev)}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {formatUSD(reg.totalRevenue)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold bg-indigo-50/20 dark:bg-indigo-950/10">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isPositiveDelta
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositiveDelta ? '+' : ''}
                        {formatUSD(reg.deltaRevenue)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold bg-indigo-50/20 dark:bg-indigo-950/10">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                          isPositiveDelta
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isPositiveDelta ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isPositiveDelta ? '+' : ''}
                        {reg.pctChange.toFixed(1)}%
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Drilldown Panel */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <td colSpan={quarters.length + 5} className="p-4 sm:p-5">
                        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-inner">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                {reg.region} • Q2 vs Q3 Underlying Product & Volume Drivers
                              </h4>
                            </div>
                            <div className="text-xs text-slate-500">
                              Avg Discount: Q2: {reg.avgDiscountQ2.toFixed(1)}% → Q3: {reg.avgDiscountQ3.toFixed(1)}%
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Product Breakdown */}
                            <div>
                              <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                                <span>Product Line Shifts:</span>
                              </div>
                              <div className="space-y-1.5">
                                {reg.productDrivers.length > 0 ? (
                                  reg.productDrivers.map((p) => (
                                    <div
                                      key={p.product}
                                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs"
                                    >
                                      <div>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                          {p.product}
                                        </span>
                                        <div className="text-[11px] text-slate-400">
                                          {p.q2Units} units → {p.q3Units} units ({p.deltaUnits >= 0 ? '+' : ''}
                                          {p.deltaUnits})
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-mono text-slate-700 dark:text-slate-300">
                                          {formatUSD(p.q2Revenue)} → {formatUSD(p.q3Revenue)}
                                        </div>
                                        <div
                                          className={`font-mono text-[11px] font-semibold ${
                                            p.deltaRevenue >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                          }`}
                                        >
                                          {p.deltaRevenue >= 0 ? '+' : ''}
                                          {formatUSD(p.deltaRevenue)} ({p.deltaRevenue >= 0 ? '+' : ''}
                                          {p.pctChange.toFixed(1)}%)
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-slate-400 italic">No Q2/Q3 product orders recorded</div>
                                )}
                              </div>
                            </div>

                            {/* Channel Breakdown */}
                            <div>
                              <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Sales Channels:</span>
                              </div>
                              <div className="space-y-1.5">
                                {reg.channelDrivers.length > 0 ? (
                                  reg.channelDrivers.map((c) => (
                                    <div
                                      key={c.channel}
                                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs"
                                    >
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {c.channel}
                                      </span>
                                      <div className="text-right">
                                        <div className="font-mono text-slate-700 dark:text-slate-300">
                                          {formatUSD(c.q2Revenue)} → {formatUSD(c.q3Revenue)}
                                        </div>
                                        <div
                                          className={`font-mono text-[11px] font-semibold ${
                                            c.deltaRevenue >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                          }`}
                                        >
                                          {c.deltaRevenue >= 0 ? '+' : ''}
                                          {formatUSD(c.deltaRevenue)} ({c.deltaRevenue >= 0 ? '+' : ''}
                                          {c.pctChange.toFixed(1)}%)
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-slate-400 italic">No Q2/Q3 channel orders recorded</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot>
            <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-semibold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 uppercase text-xs tracking-wider">Total Company</td>
              {quarters.map((q) => {
                const totalQ = regionsData.reduce((sum, r) => sum + (r.quarterlyRevenue[q] || 0), 0);
                return (
                  <td key={q} className="py-3 px-4 text-right font-mono">
                    {formatUSD(totalQ)}
                  </td>
                );
              })}
              <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {formatUSD(overallStats.totalRevenue)}
              </td>
              <td className="py-3 px-4 text-right font-mono">
                <span
                  className={
                    overallStats.deltaRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {overallStats.deltaRevenue >= 0 ? '+' : ''}
                  {formatUSD(overallStats.deltaRevenue)}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono">
                <span
                  className={
                    overallStats.deltaRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {overallStats.deltaRevenue >= 0 ? '+' : ''}
                  {overallStats.pctChange.toFixed(1)}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center">
        Click any regional row to expand detailed product line and sales channel variance drivers.
      </div>
    </div>
  );
};
