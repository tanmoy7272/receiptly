import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Edit3, Trash2, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { ROUTES } from '../../utils/constants';
import { formatIndianDate, formatINR } from '../../utils/formatters';

export const getWarrantyBadge = (expiryDate) => {
  if (!expiryDate) return null;

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'EXPIRED', label: 'Warranty Expired', badgeClass: 'bg-slate-100 text-slate-500 font-medium' };
  } else if (diffDays <= 30) {
    return { status: 'EXPIRING_SOON', label: `⚠️ Expires in ${diffDays} days`, badgeClass: 'bg-amber-100 text-amber-900 font-bold border border-amber-300' };
  } else {
    return { status: 'ACTIVE', label: `🟢 ${diffDays} days warranty left`, badgeClass: 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' };
  }
};

export const ReceiptCard = ({ receipt, onDelete }) => {
  const amountFormatted = formatINR(receipt.amount, receipt.currency);

  const isPdf = receipt.fileType === 'application/pdf' || receipt.fileUrl?.endsWith('.pdf');
  const previewUrl = receipt.fileUrl;

  const warrantyBadge = receipt.hasWarranty || receipt.warrantyExpiryDate
    ? getWarrantyBadge(receipt.warrantyExpiryDate)
    : null;

  return (
    <Card className="flex flex-col justify-between hover:border-slate-300 transition-colors shadow-subtle">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={ROUTES.RECEIPT_DETAIL(receipt.id)} className="flex-shrink-0">
              {receipt.fileUrl ? (
                <img
                  src={previewUrl}
                  alt={receipt.title}
                  className="h-12 w-12 rounded-lg object-cover border border-slate-200 bg-slate-50 hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                style={{ display: receipt.fileUrl ? 'none' : 'flex' }}
                className="h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200"
              >
                <FileText className="h-6 w-6" />
              </div>
            </Link>
            <div className="min-w-0">
              <Link to={ROUTES.RECEIPT_DETAIL(receipt.id)}>
                <h3 className="text-base font-semibold text-slate-900 truncate hover:text-slate-700 transition-colors" title={receipt.title}>
                  {receipt.title}
                </h3>
              </Link>
              <p className="text-xs text-slate-500 font-medium">{receipt.merchant}</p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-base font-bold text-slate-900">
              {amountFormatted}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 my-3">
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
            <Tag className="h-3 w-3 text-slate-500" />
            {receipt.category}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500 font-mono">
            <Calendar className="h-3 w-3" />
            {formatIndianDate(receipt.purchaseDate)}
          </span>
          {warrantyBadge && (
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${warrantyBadge.badgeClass}`}>
              <ShieldCheck className="h-3 w-3" />
              {warrantyBadge.label}
            </span>
          )}
        </div>

        {receipt.invoiceNumber && (
          <p className="text-xs text-slate-500 font-medium mb-2">
            Invoice: <span className="font-mono text-slate-700">{receipt.invoiceNumber}</span>
          </p>
        )}

        {receipt.notes && (
          <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50 p-2 rounded border border-slate-100 mb-3">
            "{receipt.notes}"
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:justify-end sm:gap-2 pt-3 border-t border-slate-100 mt-2">
        <Link to={ROUTES.RECEIPT_DETAIL(receipt.id)} className="w-full sm:w-auto">
          <button className="w-full justify-center inline-flex items-center gap-1 rounded py-1.5 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors bg-slate-50 sm:bg-transparent">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
        </Link>

        <Link to={ROUTES.RECEIPT_EDIT(receipt.id)} className="w-full sm:w-auto">
          <button className="w-full justify-center inline-flex items-center gap-1 rounded py-1.5 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors bg-slate-50 sm:bg-transparent">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </Link>

        <button
          onClick={() => onDelete(receipt.id)}
          className="w-full justify-center inline-flex items-center gap-1 rounded py-1.5 px-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors bg-red-50/50 sm:bg-transparent"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </Card>
  );
};
