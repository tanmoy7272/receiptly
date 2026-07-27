import React, { useEffect, useRef } from 'react';
import { AlertTriangle, ExternalLink, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatINR, formatIndianDate } from '../../utils/formatters';

export const DuplicateReceiptDialog = ({
  isOpen,
  candidate,
  onContinue,
  onViewExisting,
  onCancel,
}) => {
  const continueButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      continueButtonRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen || !candidate) return null;

  const formattedAmount = formatINR(candidate.amount, candidate.currency || 'INR');
  const formattedDate = candidate.purchaseDate ? formatIndianDate(candidate.purchaseDate) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-dialog-title"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="duplicate-dialog-title" className="text-base font-bold text-slate-900">
                Similar Receipt Found
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                We found a receipt that looks very similar to this one. You can review it or continue uploading.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Existing Candidate Details Card */}
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <span>Existing Candidate</span>
            {candidate.invoiceNumber && <span className="font-mono text-slate-700">#{candidate.invoiceNumber}</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]" title={candidate.title}>
              {candidate.title}
            </span>
            <span className="font-bold text-slate-900 text-sm">{formattedAmount}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
            <span>{candidate.merchant}</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewExisting(candidate.id)}
            className="w-full sm:w-auto text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Existing
          </Button>

          <Button
            ref={continueButtonRef}
            type="button"
            variant="primary"
            size="sm"
            onClick={onContinue}
            className="w-full sm:w-auto"
          >
            Continue Upload <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
