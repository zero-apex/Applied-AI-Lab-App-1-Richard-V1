import React, { useState } from 'react';
import { RegionalMetric, OverallStats } from '../types';
import { formatUSD, formatCompactUSD } from '../utils/calculations';
import { BarChart3, TrendingUp, Layers, Info } from 'lucide-react';

interface RevenueChartProps {
  regionsData: RegionalMetric[];
  overallStats: OverallStats;
  mostChangedRegion: string | null;
}

// Quarter color palette
const QUARTER_COLORS: Record<string, { fill: string; border: string; bg: string; text: string }> = {
  Q1: { fill: '#60a5fa', border: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  Q2: { fill: '#f59e0b', border: '#d97706', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  Q3: { fill: '#10b981', border: '#059669', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  Q4: { fill: '#8b5cf6', border: '#7c3aed', bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
};

export const RevenueChart: React.FC<RevenueChartProps> = ({
  regionsData,
  overallStats,
  mostChangedRegion,
}) => {
  const [chartType, setChartType] = useState<'grouped' | 'stacked' | 'q2q3focus'>('grouped');
  const [hoveredBar, setHoveredBar] = useState<{
    region: string;
    quarter: string;
    revenue: number;
    units: number;
    x: number;
    y: number;
  } | null>(null);

  const quarters = overallStats.quarters.length > 0 ? overallStats.quarters : ['Q1', 'Q2', 'Q3', 'Q4'];
  const activeQuarters = chartType === 'q2q3focus' ? ['Q2', 'Q3'] : quarters;

  // Find max value for scaling
  let maxRevenue = 0;
  if (chartType === 'stacked') {
    regionsData.forEach((r) => {
      const sum = activeQuarters.reduce((acc, q) => acc + (r.quarterlyRevenue[q] || 0), 0);
      if (sum > maxRevenue) maxRevenue = sum;
    });
  } else {
    regionsData.forEach((r) => {
      activeQuarters.forEach((q) => {
        const val = r.quarterlyRevenue[q] || 0;
        if (val > maxRevenue) maxRevenue = val;
      });
    });
  }

  // Ensure non-zero ceiling with 15% headroom
  maxRevenue = Math.max(maxRevenue * 1.15, 1000);

  // SVG dimensions
  const svgHeight = 360;
  const paddingBottom = 60;
  const paddingTop = 30;
  const paddingLeft = 75;
  const paddingRight = 30;
  const availableHeight = svgHeight - paddingTop - paddingBottom;

  // Grid lines
  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 sm:p-6 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Total Revenue by Region & Quarter
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare revenue distribution across regions with emphasis on Q2 vs Q3 performance
              </p>
            </div>
          </div>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setChartType('grouped')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              chartType === 'grouped'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Grouped Bars
          </button>
          <button
            onClick={() => setChartType('q2q3focus')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              chartType === 'q2q3focus'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Q2 vs Q3 Delta
          </button>
          <button
            onClick={() => setChartType('stacked')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              chartType === 'stacked'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Stacked
          </button>
        </div>
      </div>

      {/* Legend & Most Changed Callout */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-medium">Quarters:</span>
          {activeQuarters.map((q) => {
            const c = QUARTER_COLORS[q] || { fill: '#94a3b8', bg: 'bg-slate-400' };
            return (
              <div key={q} className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className={`w-3 h-3 rounded-xs ${c.bg}`} />
                <span>{q}</span>
              </div>
            );
          })}
        </div>

        {mostChangedRegion && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-full text-amber-700 dark:text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              Largest Q2→Q3 Shift: <strong>{mostChangedRegion}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Interactive Chart Container */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 800 ${svgHeight}`}
          className="w-full min-w-[550px] h-auto overflow-visible"
        >
          {/* Y Axis Grid lines and labels */}
          {gridTicks.map((tick) => {
            const y = paddingTop + availableHeight * (1 - tick);
            const val = maxRevenue * tick;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={800 - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray={tick === 0 ? '' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {formatCompactUSD(val)}
                </text>
              </g>
            );
          })}

          {/* Region Columns */}
          {regionsData.map((reg, rIndex) => {
            const totalRegions = regionsData.length;
            const regionSlotWidth = (800 - paddingLeft - paddingRight) / Math.max(totalRegions, 1);
            const regionCenterX = paddingLeft + rIndex * regionSlotWidth + regionSlotWidth / 2;
            const isTopChanged = reg.region === mostChangedRegion;

            if (chartType === 'stacked') {
              let currentStackY = paddingTop + availableHeight;
              const barWidth = Math.min(regionSlotWidth * 0.45, 50);

              return (
                <g key={reg.region}>
                  {/* Region background highlight if most changed */}
                  {isTopChanged && (
                    <rect
                      x={regionCenterX - regionSlotWidth * 0.46}
                      y={paddingTop - 10}
                      width={regionSlotWidth * 0.92}
                      height={availableHeight + 20}
                      rx="12"
                      className="fill-amber-500/5 dark:fill-amber-400/5 stroke-amber-400/30 dark:stroke-amber-500/30"
                      strokeDasharray="4 4"
                    />
                  )}

                  {activeQuarters.map((q) => {
                    const rev = reg.quarterlyRevenue[q] || 0;
                    const segmentHeight = (rev / maxRevenue) * availableHeight;
                    const y = currentStackY - segmentHeight;
                    currentStackY = y;

                    const color = QUARTER_COLORS[q] || { fill: '#94a3b8', border: '#64748b' };

                    return (
                      <rect
                        key={q}
                        x={regionCenterX - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={Math.max(segmentHeight, 0)}
                        fill={color.fill}
                        className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBar({
                            region: reg.region,
                            quarter: q,
                            revenue: rev,
                            units: reg.quarterlyUnits[q] || 0,
                            x: rect.x + rect.width / 2,
                            y: rect.y,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    );
                  })}

                  {/* Region Name Label */}
                  <text
                    x={regionCenterX}
                    y={svgHeight - paddingBottom + 22}
                    textAnchor="middle"
                    className={`text-[12px] font-medium ${
                      isTopChanged
                        ? 'fill-amber-600 dark:fill-amber-400 font-bold'
                        : 'fill-slate-700 dark:fill-slate-300'
                    }`}
                  >
                    {reg.region}
                  </text>
                  <text
                    x={regionCenterX}
                    y={svgHeight - paddingBottom + 38}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                  >
                    {formatCompactUSD(reg.totalRevenue)}
                  </text>
                </g>
              );
            }

            // Grouped or Q2 vs Q3 Focus Bar Chart
            const numBars = activeQuarters.length;
            const groupBarWidth = Math.min((regionSlotWidth * 0.75) / numBars, 32);
            const groupTotalWidth = numBars * groupBarWidth;
            const startX = regionCenterX - groupTotalWidth / 2;

            return (
              <g key={reg.region}>
                {/* Most changed highlight backdrop */}
                {isTopChanged && (
                  <rect
                    x={regionCenterX - regionSlotWidth * 0.46}
                    y={paddingTop - 10}
                    width={regionSlotWidth * 0.92}
                    height={availableHeight + 20}
                    rx="12"
                    className="fill-amber-500/5 dark:fill-amber-400/5 stroke-amber-400/40 dark:stroke-amber-500/30"
                    strokeDasharray="4 4"
                  />
                )}

                {activeQuarters.map((q, qIndex) => {
                  const rev = reg.quarterlyRevenue[q] || 0;
                  const barHeight = (rev / maxRevenue) * availableHeight;
                  const barX = startX + qIndex * groupBarWidth;
                  const barY = paddingTop + availableHeight - barHeight;
                  const color = QUARTER_COLORS[q] || { fill: '#94a3b8', border: '#64748b' };

                  return (
                    <g key={q}>
                      <rect
                        x={barX + 2}
                        y={barY}
                        width={Math.max(groupBarWidth - 4, 4)}
                        height={Math.max(barHeight, 0)}
                        rx="4"
                        fill={color.fill}
                        className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBar({
                            region: reg.region,
                            quarter: q,
                            revenue: rev,
                            units: reg.quarterlyUnits[q] || 0,
                            x: rect.x + rect.width / 2,
                            y: rect.y,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </g>
                  );
                })}

                {/* Delta Badge for Q2 vs Q3 */}
                {reg.q2Revenue > 0 && reg.q3Revenue > 0 && (
                  <g>
                    <text
                      x={regionCenterX}
                      y={paddingTop - 2}
                      textAnchor="middle"
                      className={`text-[10px] font-semibold font-mono ${
                        reg.deltaRevenue >= 0
                          ? 'fill-emerald-600 dark:fill-emerald-400'
                          : 'fill-rose-600 dark:fill-rose-400'
                      }`}
                    >
                      {reg.deltaRevenue >= 0 ? '+' : ''}
                      {reg.pctChange.toFixed(0)}%
                    </text>
                  </g>
                )}

                {/* Region Name Label */}
                <text
                  x={regionCenterX}
                  y={svgHeight - paddingBottom + 22}
                  textAnchor="middle"
                  className={`text-[12px] font-medium ${
                    isTopChanged
                      ? 'fill-amber-600 dark:fill-amber-400 font-bold'
                      : 'fill-slate-700 dark:fill-slate-300'
                  }`}
                >
                  {reg.region}
                </text>
                <text
                  x={regionCenterX}
                  y={svgHeight - paddingBottom + 38}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {formatCompactUSD(reg.totalRevenue)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredBar && (
          <div
            className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full -mt-2 bg-slate-900/95 dark:bg-slate-950/95 text-white px-3 py-2 rounded-xl text-xs shadow-xl backdrop-blur-xs border border-slate-700"
            style={{ left: hoveredBar.x, top: hoveredBar.y }}
          >
            <div className="font-semibold text-slate-200">
              {hoveredBar.region} • <span className="text-amber-400">{hoveredBar.quarter}</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {formatUSD(hoveredBar.revenue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Units: <span className="text-slate-200 font-mono">{hoveredBar.units.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 dark:text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Hover any bar to see exact dollar volume and units. Percentages above columns indicate Q2 to Q3 delta.</span>
      </div>
    </div>
  );
};
