import React from 'react';
import { Receipt } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">{APP_NAME}</span>
            <span className="text-xs text-slate-500 hidden sm:inline">— {APP_TAGLINE}</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
