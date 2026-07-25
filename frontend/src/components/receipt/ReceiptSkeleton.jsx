import React from 'react';

export const ReceiptSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-subtle flex flex-col justify-between h-48"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-200 flex-shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <div className="h-6 w-12 bg-slate-100 rounded" />
            <div className="h-6 w-12 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
