import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { generateCsvTemplate } from '../utils/csvParser';
import { SAMPLE_TECH_SALES_CSV, SAMPLE_RETAIL_SALES_CSV, fetchLab1Csv } from '../utils/sampleData';
import { CleaningReport } from '../types';

interface CsvUploaderProps {
  onCsvLoaded: (csvText: string, filename?: string) => void;
  activeFilename: string | null;
  totalRows: number;
  errors: string[];
  cleaningReport?: CleaningReport;
  onOpenCleaningReport?: () => void;
  autoCleanEnabled?: boolean;
  onToggleAutoClean?: () => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onCsvLoaded,
  activeFilename,
  totalRows,
  errors,
  cleaningReport,
  onOpenCleaningReport,
  autoCleanEnabled = true,
  onToggleAutoClean,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isLoadingLab1, setIsLoadingLab1] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadLab1 = async () => {
    try {
      setIsLoadingLab1(true);
      const csv = await fetchLab1Csv();
      onCsvLoaded(csv, 'Lab_1_-_Regional_Sales.csv');
    } catch (err) {
      console.error('Failed to load Lab 1 CSV:', err);
    } finally {
      setIsLoadingLab1(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a standard .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onCsvLoaded(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (pastedText.trim()) {
      onCsvLoaded(pastedText.trim(), 'pasted_sales_orders.csv');
      setShowPasteModal(false);
      setPastedText('');
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCsvTemplate();
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + template);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sales_orders_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Upload Sales Orders CSV
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Requires columns:{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              quarter
            </code>
            ,{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              region
            </code>
            ,{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              channel
            </code>
            ,{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              product
            </code>
            ,{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              units
            </code>
            ,{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              discount_pct
            </code>
            ,{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded text-[11px]">
              revenue
            </code>
          </p>
        </div>

        {/* Quick Sample Loaders & Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadLab1}
            disabled={isLoadingLab1}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
            title="Load the user's Lab 1 dataset with West and west entries"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>{isLoadingLab1 ? 'Loading Lab 1...' : "Load Lab 1 Dataset (with 'west')"}</span>
          </button>
          <button
            onClick={() => onCsvLoaded(SAMPLE_TECH_SALES_CSV, 'tech_hardware_cloud_sales.csv')}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
          >
            Load Tech Sample
          </button>
          <button
            onClick={() => onCsvLoaded(SAMPLE_RETAIL_SALES_CSV, 'global_retail_sales.csv')}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Load Retail Sample
          </button>
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Paste CSV
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            title="Download standard CSV template"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-full">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Click to browse
            </span>{' '}
            <span className="text-sm text-slate-500 dark:text-slate-400">
              or drag & drop your sales orders CSV
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Accepts UTF-8 comma, semicolon, or tab-delimited files up to 10MB
          </p>
        </div>
      </div>

      {/* Active File & Validation Status */}
      {activeFilename && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Active Dataset: <strong>{activeFilename}</strong> ({totalRows.toLocaleString()} orders loaded)
            </span>

            {cleaningReport && cleaningReport.totalCleaned > 0 && autoCleanEnabled && (
              <button
                onClick={onOpenCleaningReport}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-800/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 cursor-pointer transition-colors"
                title="Click to view all sanitized human errors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>
                  {cleaningReport.totalCleaned} Human Errors Auto-Cleaned
                  {cleaningReport.mergedRegions['West'] ? ' ("west" → "West")' : ''}
                </span>
                <span className="underline ml-0.5">Inspect</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onToggleAutoClean && (
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={autoCleanEnabled}
                  onChange={onToggleAutoClean}
                  className="rounded text-indigo-600 cursor-pointer"
                />
                <span>Auto-Clean Text</span>
              </label>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Change File
            </button>
          </div>
        </div>
      )}

      {/* Errors Banner */}
      {errors.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">CSV Formatting Issues:</div>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Direct CSV Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Paste Raw CSV Text
              </h4>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Paste sales order lines including the header row (quarter, region, channel, product, units, discount_pct, revenue).
            </p>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="quarter,region,channel,product,units,discount_pct,revenue&#10;Q2,North America,Direct,Cloud Enterprise,180,0.05,360000&#10;Q3,North America,Direct,Cloud Enterprise,205,0.05,410000"
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                Process Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
