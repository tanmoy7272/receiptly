import React from 'react';
import { Card } from '../ui/Card';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Overview Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="p-5">
            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-32 bg-slate-300 rounded mb-1" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </Card>
        ))}
      </div>

      {/* Chart & Category Breakdown Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 h-80">
          <div className="h-4 w-36 bg-slate-200 rounded mb-4" />
          <div className="h-60 w-full bg-slate-100 rounded-lg" />
        </Card>
        <Card className="p-6 h-80">
          <div className="h-4 w-36 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 rounded" />
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Receipts Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-6 h-40">
              <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
