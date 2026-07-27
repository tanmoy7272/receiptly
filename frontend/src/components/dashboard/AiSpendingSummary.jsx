import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { dashboardService } from '../../services/dashboardService';

export const AiSpendingSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // 150ms delay timer before displaying skeleton to prevent UI flashing on fast cache hits
    const skeletonTimer = setTimeout(() => {
      if (isMounted && loading) {
        setShowSkeleton(true);
      }
    }, 150);

    const loadSummary = async () => {
      try {
        const res = await dashboardService.getDashboardAiSummary({ signal: controller.signal });
        if (isMounted) {
          if (res?.enabled && Array.isArray(res?.summary) && res.summary.length > 0) {
            setSummary(res.summary);
          } else {
            setSummary(null);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          setSummary(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setShowSkeleton(false);
        }
      }
    };

    // Non-blocking fetch scheduled when browser is idle post-render
    let idleId = null;
    let fallbackTimeout = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        loadSummary();
      });
    } else {
      fallbackTimeout = setTimeout(() => {
        loadSummary();
      }, 0);
    }

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(skeletonTimer);
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
    };
  }, []);

  // While fetching, only show skeleton if loading exceeds 150ms delay
  if (loading) {
    if (!showSkeleton) return null;
    return (
      <Card className="p-4 sm:p-5 border-slate-200 bg-slate-50/50 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-slate-300 rounded" />
          <div className="h-4 w-32 bg-slate-300 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-200 rounded" />
        </div>
      </Card>
    );
  }

  // Hide card completely on failure, disabled state, or empty response
  if (!summary || summary.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 sm:p-6 border-slate-200 bg-white shadow-xs rounded-xl transition-all duration-200">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-slate-800" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Spending Insights
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              Real-time spend patterns & trend analysis
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 tracking-wide uppercase">
          ✨ AI Summary
        </span>
      </div>

      {/* Micro-Insight Cards Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {summary.map((bullet, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex items-start gap-2.5"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-slate-700 mt-1.5 shrink-0" />
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {bullet}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};
