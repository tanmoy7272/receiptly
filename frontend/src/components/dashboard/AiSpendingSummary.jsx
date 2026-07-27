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
    <Card className="p-4 sm:p-5 border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50 to-purple-50/40 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center p-1 rounded-md bg-indigo-100/80 text-indigo-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold tracking-tight text-slate-900">
          Spending Insights
        </h2>
      </div>

      <ul className="space-y-2 pl-1">
        {summary.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
