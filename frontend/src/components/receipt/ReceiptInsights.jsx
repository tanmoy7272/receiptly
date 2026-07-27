import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { receiptService } from '../../services/receiptService';

export const ReceiptInsights = ({ receiptId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!receiptId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const currentReceiptId = receiptId;

    // 150ms delay timer before displaying skeleton to avoid visual layout flash on fast cache hits
    const skeletonTimer = setTimeout(() => {
      if (isMounted && loading) {
        setShowSkeleton(true);
      }
    }, 150);

    const loadInsights = async () => {
      try {
        const res = await receiptService.getReceiptInsights(receiptId, { signal: controller.signal });
        // Stale response guard: ignore response if component unmounted or receiptId changed
        if (isMounted && currentReceiptId === receiptId) {
          if (res?.enabled && Array.isArray(res?.insights) && res.insights.length > 0) {
            setInsights(res.insights);
          } else {
            setInsights(null);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted && currentReceiptId === receiptId) {
          setInsights(null);
        }
      } finally {
        if (isMounted && currentReceiptId === receiptId) {
          setLoading(false);
          setShowSkeleton(false);
        }
      }
    };

    // Non-blocking fetch scheduled post-render when browser is idle
    let idleId = null;
    let fallbackTimeout = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        loadInsights();
      });
    } else {
      fallbackTimeout = setTimeout(() => {
        loadInsights();
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
  }, [receiptId]);

  // While fetching, show skeleton only if loading exceeds 150ms delay
  if (loading) {
    if (!showSkeleton) return null;
    return (
      <Card className="p-4 border-slate-200 bg-slate-50/50 animate-pulse transition-opacity duration-150">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-4 w-4 bg-slate-300 rounded" />
          <div className="h-4 w-24 bg-slate-300 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-5/6 bg-slate-200 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
        </div>
      </Card>
    );
  }

  // Silently return null when insights are unavailable, disabled, or empty
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50 to-purple-50/40 shadow-xs transition-opacity duration-150 ease-in-out">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex items-center justify-center p-1 rounded bg-indigo-100/80 text-indigo-600">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-xs font-bold tracking-tight text-slate-900">
          Insights
        </h3>
      </div>

      <ul className="space-y-1.5 pl-0.5">
        {insights.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium leading-relaxed">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
