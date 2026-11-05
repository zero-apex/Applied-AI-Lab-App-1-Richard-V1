/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesOrder, AiSummaryResponse, SummaryCalculationPayload, CleaningReport } from './types';
import { parseSalesCsv } from './utils/csvParser';
import { SAMPLE_TECH_SALES_CSV, fetchLab1Csv } from './utils/sampleData';
import { calculateRegionalAnalytics, formatUSD, formatCompactUSD } from './utils/calculations';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { AiSummaryCard } from './components/AiSummaryCard';
import { CsvUploader } from './components/CsvUploader';
import { RawDataDrawer } from './components/RawDataDrawer';
import { DataCleaningModal } from './components/DataCleaningModal';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  Database,
  Filter,
  RotateCcw,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [rawCsvText, setRawCsvText] = useState<string>(SAMPLE_TECH_SALES_CSV);
  const [autoCleanEnabled, setAutoCleanEnabled] = useState<boolean>(true);

  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    const res = parseSalesCsv(SAMPLE_TECH_SALES_CSV, { autoClean: true });
    return res.data;
  });

  const [cleaningReport, setCleaningReport] = useState<CleaningReport>(() => {
    const res = parseSalesCsv(SAMPLE_TECH_SALES_CSV, { autoClean: true });
    return res.cleaningReport;
  });

  const [activeFilename, setActiveFilename] = useState<string | null>('tech_hardware_cloud_sales.csv');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');

  const [aiSummary, setAiSummary] = useState<AiSummaryResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showRawOrders, setShowRawOrders] = useState<boolean>(false);
  const [showCleaningModal, setShowCleaningModal] = useState<boolean>(false);

  // Automatically load the user's Lab 1 dataset on initial mount
  useEffect(() => {
    async function loadInitialLab1() {
      try {
        const lab1Text = await fetchLab1Csv();
        setRawCsvText(lab1Text);
        const res = parseSalesCsv(lab1Text, { autoClean: true });
        if (res.data.length > 0) {
          setOrders(res.data);
          setCleaningReport(res.cleaningReport);
          setActiveFilename('Lab_1_-_Regional_Sales.csv');
        }
      } catch (err) {
        console.warn('Lab 1 initial load skipped; using tech sales sample.', err);
      }
    }
    loadInitialLab1();
  }, []);

  // Handle new CSV upload or sample load
  const handleCsvLoaded = useCallback((csvText: string, filename?: string) => {
    setRawCsvText(csvText);
    const result = parseSalesCsv(csvText, { autoClean: autoCleanEnabled });
    if (result.errors.length > 0) {
      setParseErrors(result.errors);
      return;
    }
    setParseErrors([]);
    setOrders(result.data);
    setCleaningReport(result.cleaningReport);
    setActiveFilename(filename || 'uploaded_sales_orders.csv');
    // Reset filters
    setSelectedChannel('ALL');
    setSelectedProduct('ALL');
  }, [autoCleanEnabled]);

  // Toggle Auto-Clean logic on/off to let user see raw vs cleaned state
  const handleToggleAutoClean = useCallback(() => {
    const nextVal = !autoCleanEnabled;
    setAutoCleanEnabled(nextVal);
    if (rawCsvText) {
      const res = parseSalesCsv(rawCsvText, { autoClean: nextVal });
      if (res.data.length > 0) {
        setOrders(res.data);
        setCleaningReport(res.cleaningReport);
      }
    }
  }, [autoCleanEnabled, rawCsvText]);

  // Pure mathematical analytics based on current orders & filters
  const calculationPayload: SummaryCalculationPayload = useMemo(() => {
    return calculateRegionalAnalytics(orders, {
      channel: selectedChannel,
      product: selectedProduct,
    });
  }, [orders, selectedChannel, selectedProduct]);

  // Request the AI executive summary from backend
  const requestAiSummary = useCallback(async (payload: SummaryCalculationPayload) => {
    if (!payload.regionsData || payload.regionsData.length === 0) {
      setAiSummary(null);
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/summarize-q2-q3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionsData: payload.regionsData,
          mostChangedAbsolute: payload.mostChangedAbsolute,
          mostChangedPercentage: payload.mostChangedPercentage,
          overallStats: payload.overallStats,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: AiSummaryResponse = await response.json();
      setAiSummary(data);
    } catch (err: any) {
      console.error('Failed to fetch AI summary:', err);
      setAiError(err.message || 'Unable to generate summary');
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Trigger summary generation on data changes
  useEffect(() => {
    requestAiSummary(calculationPayload);
  }, [orders, selectedChannel, selectedProduct, requestAiSummary]);

  const topMover = calculationPayload.mostChangedAbsolute;
  const overall = calculationPayload.overallStats;
  const westWasCleaned = Boolean(cleaningReport?.mergedRegions?.['West']);

  return (
    <div className="min-h-screen bg-[#4169e1] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-blue-300/40 dark:border-blue-900/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  OmniSales Regional Analytics
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Quarterly Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Revenue by Region & Quarter • Q2 to Q3 AI Driver Summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Cleaning Report Trigger Button */}
            {cleaningReport && cleaningReport.totalCleaned > 0 && autoCleanEnabled && (
              <button
                onClick={() => setShowCleaningModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer shadow-xs"
                title="View human error data cleaning report"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>
                  {cleaningReport.totalCleaned} Human Errors Cleaned
                  {westWasCleaned ? " ('west' → 'West')" : ''}
                </span>
              </button>
            )}

            <button
              onClick={() => setShowRawOrders(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>Explore Orders ({orders.length.toLocaleString()})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Human Error Cleaning Alert Banner if west was merged */}
        {westWasCleaned && autoCleanEnabled && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-amber-950/30 dark:to-indigo-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Data Cleaning Safeguard Active: Harmonized "west" & "West"</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                    Cleaned
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Detected and merged lowercase <code className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 px-1 py-0.5 rounded">"west"</code> entries into canonical <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 px-1 py-0.5 rounded">"West"</code> across orders (e.g. ORD-10236, ORD-10300, ORD-10416). This preserved <strong>$1,607.40</strong> in West's quarterly revenue, preventing split reporting.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setShowCleaningModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Inspect Audit Diff
              </button>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {formatUSD(overall.totalRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Across {overall.quarters.length} Quarters ({overall.quarters.join(', ')})</span>
            </div>
          </div>

          {/* Card 2: Q2 vs Q3 Company Shift */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Q2 → Q3 Total Delta
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
              <span className={overall.deltaRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {overall.deltaRevenue >= 0 ? '+' : ''}
                {formatCompactUSD(overall.deltaRevenue)}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                overall.deltaRevenue >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
              }`}>
                {overall.deltaRevenue >= 0 ? '+' : ''}{overall.pctChange.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatUSD(overall.q2Revenue)} (Q2) → {formatUSD(overall.q3Revenue)} (Q3)
            </div>
          </div>

          {/* Card 3: Top Regional Mover */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Largest Q2→Q3 Shift
              </span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white truncate">
              {topMover ? topMover.region : 'None'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {topMover ? (
                <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                  {topMover.deltaRevenue >= 0 ? '+' : ''}{formatUSD(topMover.deltaRevenue)} ({topMover.deltaRevenue >= 0 ? '+' : ''}{topMover.pctChange.toFixed(1)}%)
                </span>
              ) : (
                'No Q2/Q3 orders'
              )}
            </div>
          </div>

          {/* Card 4: Orders & Dimensions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Analyzed Footprint
              </span>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {calculationPayload.regionsData.length} Regions
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {overall.channels.length} channels • {overall.products.length} products • {overall.totalOrders} rows
            </div>
          </div>
        </div>

        {/* Global Filter Toolbar & Data Cleaning Toggle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Filter className="w-4 h-4 text-indigo-500" />
              <span>Filter Data:</span>
            </div>

            {/* Channel filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Channel:</span>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-indigo-500"
              >
                <option value="ALL">All Channels ({overall.channels.length})</option>
                {overall.channels.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            {/* Product filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Product:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-indigo-500"
              >
                <option value="ALL">All Products ({overall.products.length})</option>
                {overall.products.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {(selectedChannel !== 'ALL' || selectedProduct !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedChannel('ALL');
                  setSelectedProduct('ALL');
                }}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {cleaningReport && cleaningReport.totalCleaned > 0 && (
              <button
                onClick={() => setShowCleaningModal(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                View {cleaningReport.totalCleaned} text fixes
              </button>
            )}
            <span className="text-slate-400 hidden md:inline">
              Calculations update immediately upon filter or file changes.
            </span>
          </div>
        </div>

        {/* Section 1: AI Executive Three-Sentence Summary */}
        <AiSummaryCard
          summaryData={aiSummary}
          loading={aiLoading}
          error={aiError}
          payload={calculationPayload}
          onRefresh={() => requestAiSummary(calculationPayload)}
        />

        {/* Section 2: Revenue Chart */}
        <RevenueChart
          regionsData={calculationPayload.regionsData}
          overallStats={calculationPayload.overallStats}
          mostChangedRegion={topMover ? topMover.region : null}
        />

        {/* Section 3: Revenue Matrix Table */}
        <RevenueTable
          regionsData={calculationPayload.regionsData}
          overallStats={calculationPayload.overallStats}
          mostChangedRegion={topMover ? topMover.region : null}
        />

        {/* Section 4: CSV Upload & Data Source Controls */}
        <CsvUploader
          onCsvLoaded={handleCsvLoaded}
          activeFilename={activeFilename}
          totalRows={orders.length}
          errors={parseErrors}
          cleaningReport={cleaningReport}
          onOpenCleaningReport={() => setShowCleaningModal(true)}
          autoCleanEnabled={autoCleanEnabled}
          onToggleAutoClean={handleToggleAutoClean}
        />
      </main>

      {/* Raw Data Explorer Drawer / Modal */}
      <RawDataDrawer
        orders={orders}
        isOpen={showRawOrders}
        onClose={() => setShowRawOrders(false)}
      />

      {/* Data Cleaning Audit Report Modal */}
      {cleaningReport && (
        <DataCleaningModal
          report={cleaningReport}
          isOpen={showCleaningModal}
          onClose={() => setShowCleaningModal(false)}
          autoCleanEnabled={autoCleanEnabled}
          onToggleAutoClean={handleToggleAutoClean}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-blue-300/40 dark:border-blue-900/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md py-6 text-center text-xs text-slate-600 dark:text-slate-400">
        <p>OmniSales Regional Analytics • Automated text sanitization for human error & mathematical grounding</p>
      </footer>
    </div>
  );
}
