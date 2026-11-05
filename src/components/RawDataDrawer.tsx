import React, { useState } from 'react';
import { SalesOrder } from '../types';
import { formatUSD } from '../utils/calculations';
import { Search, ChevronLeft, ChevronRight, X, FileSpreadsheet } from 'lucide-react';

interface RawDataDrawerProps {
  orders: SalesOrder[];
  isOpen: boolean;
  onClose: () => void;
}

export const RawDataDrawer: React.FC<RawDataDrawerProps> = ({ orders, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  if (!isOpen) return null;

  const filtered = orders.filter((o) => {
    if (quarterFilter !== 'ALL' && o.quarter !== quarterFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        o.region.toLowerCase().includes(term) ||
        o.product.toLowerCase().includes(term) ||
        o.channel.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const quarters = Array.from(new Set(orders.map((o) => o.quarter))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Raw Sales Orders Record Explorer
              </h3>
              <p className="text-xs text-slate-500">
                Viewing {filtered.length.toLocaleString()} parsed orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by region, product, channel..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Quarter:</span>
            <select
              value={quarterFilter}
              onChange={(e) => {
                setQuarterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Quarters</option>
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-4">Quarter</th>
                <th className="py-2.5 px-4">Region</th>
                <th className="py-2.5 px-4">Channel</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4 text-right">Units</th>
                <th className="py-2.5 px-4 text-right">Discount</th>
                <th className="py-2.5 px-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.map((o, idx) => (
                <tr key={o.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                    {o.quarter}
                  </td>
                  <td className="py-2.5 px-4 text-slate-900 dark:text-white font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{o.region}</span>
                      {o.rawRegion && o.rawRegion !== o.region && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          cleaned from <span className="line-through font-mono">"{o.rawRegion}"</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>{o.channel}</span>
                      {o.rawChannel && o.rawChannel !== o.channel && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          (was "{o.rawChannel}")
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span>{o.product}</span>
                      {o.rawProduct && o.rawProduct !== o.product && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          (formatted)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    {o.units.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                    {(o.discount_pct * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {formatUSD(o.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
