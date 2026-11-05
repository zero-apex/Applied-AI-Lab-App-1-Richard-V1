import React, { useState, useEffect } from 'react';
import { AiSummaryResponse, SummaryCalculationPayload } from '../types';
import { formatUSD } from '../utils/calculations';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface AiSummaryCardProps {
  summaryData: AiSummaryResponse | null;
  loading: boolean;
  error: string | null;
  payload: SummaryCalculationPayload | null;
  onRefresh: () => void;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  summaryData,
  loading,
  error,
  payload,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viewMode, setViewMode] = useState<'paragraph' | 'breakdown'>('paragraph');
  const [showNumbersInspector, setShowNumbersInspector] = useState(false);

  // Stop speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    if (!summaryData?.summary) return;
    navigator.clipboard.writeText(summaryData.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!summaryData?.summary) return;

    const utterance = new SpeechSynthesisUtterance(summaryData.summary);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const topRegion = payload?.mostChangedAbsolute;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-400/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Executive AI Analysis
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {summaryData?.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Calculated Rule Engine'}
              </span>
            </div>
            <p className="text-xs text-indigo-200/70">
              Three-sentence executive summary of the largest Q2 to Q3 regional change & root drivers
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-indigo-950/80 border border-indigo-800/60 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('paragraph')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'paragraph'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-indigo-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paragraph
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'breakdown'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-indigo-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3 Sentences
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!summaryData?.summary || loading}
            className="p-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-800/80 border border-indigo-800/60 text-indigo-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Copy summary"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Speech Audio Button */}
          {'speechSynthesis' in window && (
            <button
              onClick={handleToggleSpeech}
              disabled={!summaryData?.summary || loading}
              className={`p-2 rounded-xl border border-indigo-800/60 transition-colors cursor-pointer disabled:opacity-50 ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-indigo-950/80 hover:bg-indigo-800/80 text-indigo-200 hover:text-white'
              }`}
              title={isSpeaking ? 'Stop reading' : 'Read aloud with Text-to-Speech'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 py-6">
        {loading ? (
          <div className="space-y-4 py-4 animate-pulse">
            <div className="h-4 bg-indigo-800/50 rounded-md w-3/4" />
            <div className="h-4 bg-indigo-800/50 rounded-md w-5/6" />
            <div className="h-4 bg-indigo-800/50 rounded-md w-2/3" />
            <div className="flex items-center gap-2 pt-2 text-xs text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Analyzing calculated regional figures and driver causality...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">Failed to generate AI summary</div>
              <div className="text-xs text-rose-300 mt-1">{error}</div>
              <button
                onClick={onRefresh}
                className="mt-3 px-3 py-1 bg-rose-800/80 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Retry Calculation
              </button>
            </div>
          </div>
        ) : summaryData ? (
          <div>
            {viewMode === 'paragraph' ? (
              <p className="text-base sm:text-lg leading-relaxed text-slate-100 font-normal selection:bg-indigo-500 selection:text-white">
                {summaryData.summary}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-700/40">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                    <span className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Primary Regional Shift (Who & Magnitude)
                  </div>
                  <p className="text-sm sm:text-base text-slate-100">
                    {summaryData.sentence1 || summaryData.summary.split('. ')[0] + '.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-700/40">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Root Cause Drivers (Why: Products, Units, Discounts)
                  </div>
                  <p className="text-sm sm:text-base text-slate-100">
                    {summaryData.sentence2 || (summaryData.summary.split('. ')[1] ? summaryData.summary.split('. ')[1] + '.' : '')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-700/40">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-1">
                    <span className="w-4 h-4 rounded-full bg-sky-400/20 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    Comparative Context & Overall Impact
                  </div>
                  <p className="text-sm sm:text-base text-slate-100">
                    {summaryData.sentence3 || (summaryData.summary.split('. ')[2] ? summaryData.summary.split('. ')[2] : '')}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-indigo-300 text-sm">
            Upload a CSV to view the automated three-sentence executive summary.
          </div>
        )}
      </div>

      {/* Grounding & Calculated Numbers Verification Bar */}
      <div className="relative z-10 pt-4 border-t border-indigo-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-slate-300">
            Strict Math Grounding: Generated using <strong>only numbers calculated by the app</strong>.
          </span>
        </div>

        <button
          onClick={() => setShowNumbersInspector(!showNumbersInspector)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto underline decoration-indigo-400/50 underline-offset-4"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-300" />
          {showNumbersInspector ? 'Hide Calculated Numbers Table' : 'Inspect Numbers Fed to AI'}
        </button>
      </div>

      {/* Expanded Calculated Numbers Inspector Drawer */}
      {showNumbersInspector && topRegion && (
        <div className="relative z-10 mt-4 p-4 rounded-2xl bg-indigo-950/90 border border-indigo-500/30 text-xs text-slate-200 animate-fadeIn">
          <div className="font-semibold text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Mathematical Payload for Largest Changer: {topRegion.region}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-indigo-800/40">
              <div className="text-indigo-300 text-[11px]">Q2 Revenue</div>
              <div className="text-base font-mono font-bold text-white mt-0.5">
                {formatUSD(topRegion.q2Revenue)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-indigo-800/40">
              <div className="text-indigo-300 text-[11px]">Q3 Revenue</div>
              <div className="text-base font-mono font-bold text-white mt-0.5">
                {formatUSD(topRegion.q3Revenue)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-indigo-800/40">
              <div className="text-indigo-300 text-[11px]">Calculated Delta ($)</div>
              <div className="text-base font-mono font-bold text-amber-300 mt-0.5">
                {topRegion.deltaRevenue >= 0 ? '+' : ''}
                {formatUSD(topRegion.deltaRevenue)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-indigo-800/40">
              <div className="text-indigo-300 text-[11px]">Calculated Delta (%)</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                {topRegion.deltaRevenue >= 0 ? '+' : ''}
                {topRegion.pctChange.toFixed(1)}%
              </div>
            </div>
          </div>

          {topRegion.productDrivers && topRegion.productDrivers.length > 0 && (
            <div className="mt-2 text-[11px] text-indigo-300">
              <strong>Key Product Shift Drivers Fed to Model: </strong>
              {topRegion.productDrivers.slice(0, 3).map((p) => (
                <span key={p.product} className="mr-3 font-mono text-slate-200">
                  {p.product}: {p.deltaRevenue >= 0 ? '+' : ''}{formatUSD(p.deltaRevenue)} ({p.deltaRevenue >= 0 ? '+' : ''}{p.pctChange.toFixed(1)}%, {p.deltaUnits >= 0 ? '+' : ''}{p.deltaUnits} units)
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
