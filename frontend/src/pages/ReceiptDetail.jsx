import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit2,
  FileText,
  Loader2,
  Sparkles,
  Tag,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { receiptService } from '../services/receiptService';
import { ROUTES, RECEIPT_CATEGORIES } from '../utils/constants';
import { getWarrantyBadge } from '../components/receipt/ReceiptCard';
import { formatIndianDate, formatINR } from '../utils/formatters';

export const ReceiptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');

  useDocumentTitle(receipt ? `${receipt.title}` : 'Receipt Details');

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [selectedFields, setSelectedFields] = useState({
    title: true,
    merchant: true,
    amount: true,
    currency: true,
    purchaseDate: true,
    category: true,
    notes: true,
    invoiceNumber: true,
  });

  const fetchReceipt = async () => {
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await receiptService.getReceiptById(id);
      setReceipt(data.receipt);
    } catch (err) {
      setError(err?.message || "We couldn't load this receipt's details right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await receiptService.deleteReceipt(id);
      toast.success('Receipt deleted.');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err?.message || "We couldn't delete this receipt right now.");
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleExtractAI = async () => {
    try {
      setAiExtracting(true);
      setAiError('');
      const response = await receiptService.extractReceipt(id);
      const extractedData = response?.extraction?.data || {};
      setAiSuggestions(extractedData);
      toast.success('Receipt details extracted.');
    } catch (err) {
      const msg = "We couldn't automatically read this receipt. You can update the details manually.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiExtracting(false);
    }
  };

  const toggleFieldSelection = (field) => {
    setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleApplyAiSuggestions = async () => {
    if (!aiSuggestions) return;

    try {
      setSavingAi(true);
      setAiError('');

      const getValue = (field, fallback) => {
        return selectedFields[field] && aiSuggestions[field]?.value
          ? aiSuggestions[field].value
          : fallback;
      };

      const rawDate = getValue('purchaseDate', receipt.purchaseDate);
      const purchaseDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : null;

      const payload = {
        title: getValue('title', receipt.title),
        merchant: getValue('merchant', receipt.merchant),
        amount: getValue('amount', receipt.amount),
        currency: getValue('currency', receipt.currency),
        purchaseDate,
        category: getValue('category', receipt.category),
        notes: getValue('notes', receipt.notes || ''),
        invoiceNumber: selectedFields.invoiceNumber && aiSuggestions.invoiceNumber?.value
          ? aiSuggestions.invoiceNumber.value
          : receipt.invoiceNumber || '',
      };

      await receiptService.updateReceipt(id, payload);
      setAiSuggestions(null);
      toast.success('Extracted details applied.');
      await fetchReceipt();
    } catch (err) {
      const msg = err?.message || "We couldn't apply the suggested details. Please try again.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setSavingAi(false);
    }
  };

  const formatCurrency = (amount, currencyKey = 'INR') => {
    return formatINR(amount, currencyKey);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return formatIndianDate(dateStr);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Card className="p-12 animate-pulse">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400 mb-3" />
          <p className="text-xs font-semibold text-slate-600">Finding your receipt details...</p>
        </Card>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Card className="p-8 border-red-200 bg-red-50/30">
          <p className="text-sm font-semibold text-red-700">{error || 'Receipt not found.'}</p>
          <div className="mt-4">
            <Link to={ROUTES.RECEIPTS}>
              <Button variant="outline" size="sm">
                Back to Receipts
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isPdf = receipt.fileType === 'application/pdf' || receipt.fileUrl?.endsWith('.pdf');
  const previewUrl = isPdf && receipt.fileUrl?.includes('/upload/')
    ? receipt.fileUrl.replace('/upload/', '/upload/f_jpg,pg_1/')
    : receipt.fileUrl;

  const warrantyBadge = receipt.hasWarranty || receipt.warrantyExpiryDate
    ? getWarrantyBadge(receipt.warrantyExpiryDate)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <Link
          to={ROUTES.RECEIPTS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Receipts
        </Link>

        <div className="flex items-center gap-2">
          {/* AI Assistant Button */}
          <Button
            variant="secondary"
            size="sm"
            disabled={aiExtracting}
            onClick={handleExtractAI}
            className="gap-1.5 border-slate-300"
          >
            {aiExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            {aiExtracting ? 'Analyzing receipt...' : 'Extract Details with AI'}
          </Button>

          <Link to={ROUTES.RECEIPT_EDIT(id)}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </Link>

          <Button
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={() => setShowConfirmDelete(true)}
            className="gap-1.5"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete this receipt?"
        message={`Are you sure you want to remove "${receipt.title}"? This action can't be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {aiError && (
        <div className="rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
          {aiError}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Document File Preview */}
        <Card className="p-4 lg:col-span-6 flex flex-col justify-between overflow-hidden bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Document Preview
            </span>
            {receipt.fileUrl && (
              <a
                href={receipt.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
              >
                Open Full Document <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="relative min-h-[320px] flex-1 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
            {receipt.fileUrl ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                {isPdf && (
                  <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded bg-red-100/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-red-700 border border-red-200 shadow-sm">
                    <FileText className="h-3.5 w-3.5" /> PDF Invoice
                  </div>
                )}
                <img
                  src={previewUrl}
                  alt={receipt.title}
                  className="h-full w-full object-contain max-h-[420px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }
                  }}
                />
                <div style={{ display: 'none' }} className="text-center p-6 text-slate-400 space-y-2">
                  <FileText className="mx-auto h-16 w-16 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Document Attached</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <FileText className="mx-auto h-12 w-12 mb-2" />
                <p className="text-xs font-medium">No document file attached</p>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Receipt Information */}
        <Card className="p-6 lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {receipt.category}
                </span>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-2">
                  {receipt.title}
                </h1>
                <p className="text-sm font-semibold text-slate-600">{receipt.merchant}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(receipt.amount, receipt.currency)}
                </p>
                <p className="text-xs text-slate-500 font-medium">{receipt.currency}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Purchase Date
                </span>
                <span className="font-bold text-slate-900">{formatDate(receipt.purchaseDate)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Category
                </span>
                <span className="font-bold text-slate-900">{receipt.category}</span>
              </div>

              {receipt.invoiceNumber && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" /> Invoice Number
                  </span>
                  <span className="font-mono font-bold text-slate-900">{receipt.invoiceNumber}</span>
                </div>
              )}

              {/* Data-Driven Warranty Details Section */}
              {warrantyBadge && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Warranty Status
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${warrantyBadge.badgeClass}`}>
                    {warrantyBadge.label}
                  </span>
                </div>
              )}
            </div>

            {receipt.notes && (
              <div className="mt-5 space-y-1 rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Notes
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{receipt.notes}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            Added on {formatDate(receipt.createdAt)}
          </div>
        </Card>
      </div>

      {/* AI Extraction Suggestions Modal / Side-by-Side Review Card */}
      {aiSuggestions && (
        <Card className="p-6 border-amber-200 bg-amber-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Extracted Receipt Suggestions</h3>
                <p className="text-xs text-slate-600">Select which extracted fields you wish to apply.</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiSuggestions(null)}
              className="text-slate-500"
            >
              Cancel
            </Button>
          </div>

          <div className="grid gap-3 text-xs sm:grid-cols-2">
            {[
              { key: 'title', label: 'Title' },
              { key: 'merchant', label: 'Merchant' },
              { key: 'amount', label: 'Amount' },
              { key: 'category', label: 'Category' },
              { key: 'purchaseDate', label: 'Purchase Date' },
              { key: 'invoiceNumber', label: 'Invoice Number' },
              { key: 'notes', label: 'Notes' },
            ].map(({ key, label }) => {
              const suggested = aiSuggestions[key]?.value;
              const current = receipt[key];
              const isSelected = selectedFields[key];

              if (!suggested) return null;

              return (
                <div
                  key={key}
                  onClick={() => toggleFieldSelection(key)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected ? 'border-amber-400 bg-amber-50/80 shadow-sm' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-500 uppercase">{label}</span>
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-slate-400 line-through text-[11px]">Current: {String(current || 'None')}</p>
                    <p className="font-bold text-slate-900">Suggested: {String(suggested)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              disabled={savingAi}
              onClick={handleApplyAiSuggestions}
              className="gap-2"
            >
              {savingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Apply Selected Changes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
