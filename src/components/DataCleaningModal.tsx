import React, { useState } from 'react';
import { CleaningReport } from '../types';
import { Sparkles, CheckCircle2, X, Filter, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface DataCleaningModalProps {
  report: CleaningReport;
  isOpen: boolean;
  onClose: () => void;
  autoCleanEnabled: boolean;
  onToggleAutoClean: () => void;
}

export const DataCleaningModal: React.FC<DataCleaningModalProps> = ({
  report,
  isOpen,
  onClose,
  autoCleanEnabled,
  onToggleAutoClean,
}) => {
  const [filterField, setFilterField] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredEntries = report.entries.filter((e) => {
    if (filterField !== 'ALL' && e.field !== filterField) return false;
    return true;
  });

  const mergedRegionKeys = Object.keys(report.mergedRegions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Data Cleaning & Human Error Report
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {report.totalCleaned} Corrections Applied
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated text sanitization for case inconsistencies, spaces, and typo normalization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Card: Merged Regions */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Case Normalization Safeguard
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Values like <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">west</code> and{' '}
                  <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">West</code> are automatically harmonized into canonical Title Case so they don't split into duplicate rows or distort quarterly delta analysis.
                </p>
              </div>
            </div>

            {/* Auto-Clean Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Auto-Clean:
              </span>
              <button
                onClick={onToggleAutoClean}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  autoCleanEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoCleanEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {mergedRegionKeys.length > 0 && (
            <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 rounded-xl flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                Merged Regional Variations:
              </span>
              {mergedRegionKeys.map((canonical) => (
                <div
                  key={canonical}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                >
                  <span className="font-bold">{canonical}</span>
                  <span className="text-[10px] text-slate-400">absorbs</span>
                  {report.mergedRegions[canonical].map((orig) => (
                    <span
                      key={orig}
                      className="line-through text-rose-500 font-mono text-[11px] bg-rose-50 dark:bg-rose-950/50 px-1 rounded"
                    >
                      "{orig}"
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Filter by Field:</span>
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="ALL">All Fields ({report.totalCleaned})</option>
              {Object.keys(report.summaryByField).map((f) => (
                <option key={f} value={f}>
                  {f} ({report.summaryByField[f]})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing {filteredEntries.length} corrections
          </span>
        </div>

        {/* Corrections Log Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4 w-16">Row</th>
                  <th className="py-2.5 px-4 w-28">Order ID</th>
                  <th className="py-2.5 px-4 w-24">Field</th>
                  <th className="py-2.5 px-4">Original Input</th>
                  <th className="py-2.5 px-4">Sanitized Result</th>
                  <th className="py-2.5 px-4">Correction Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-slate-400">{e.row}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {e.orderId || '-'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {e.field}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-rose-600 dark:text-rose-400">
                      <span className="line-through bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                        "{e.original}"
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                        "{e.cleaned}"
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                      {e.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>No human error corrections found for this filter. Data is clean!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            When auto-clean is on, data fed to the chart, table, and AI summary is fully unified.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:opacity-90 cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
