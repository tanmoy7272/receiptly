import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { RECEIPT_CATEGORIES, WARRANTY_SOURCES } from '../../utils/constants';
import { extractReceiptFileAI } from '../../services/receiptService';
import { formatDateString } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const cleanFieldValue = (str) => {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  if (/^(receipt|document|store|vendor|unknown|item|product|null|undefined)$/i.test(trimmed)) return '';
  return trimmed;
};

export const ReceiptForm = ({
  initialData = {},
  onSubmit,
  loading = false,
  isEdit = false,
  onCancel,
}) => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(initialData.fileUrl || '');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiExtractedSuccess, setAiExtractedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    title: initialData.title || '',
    merchant: initialData.merchant || '',
    merchantProvenance: initialData.merchantProvenance || 'MANUAL',
    amount: initialData.amount ? String(initialData.amount) : '',
    amountProvenance: initialData.amountProvenance || 'MANUAL',
    currency: initialData.currency || 'INR',
    purchaseDate: initialData.purchaseDate ? formatDateString(initialData.purchaseDate) : '',
    category: initialData.category || 'Other',
    notes: initialData.notes || '',
    invoiceNumber: initialData.invoiceNumber || '',
    hasWarranty: Boolean(initialData.warrantyMonths || initialData.warrantyExpiryDate),
    warrantyMonths: initialData.warrantyMonths ? String(initialData.warrantyMonths) : '',
    warrantyExpiryDate: initialData.warrantyExpiryDate ? formatDateString(initialData.warrantyExpiryDate) : '',
    warrantySource: initialData.warrantySource || 'NONE',
  });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds 10 MB limit.');
      return;
    }

    setFile(selectedFile);
    setFormError('');
    setAiExtractedSuccess(false);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
    } else {
      setFilePreview('');
    }

    const derivedTitle = selectedFile.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    setAiParsing(true);

    try {
      const extracted = await extractReceiptFileAI(selectedFile);

      const extractedWarrantyMonths = extracted.warrantyMonths?.value;
      const extractedWarrantyExpiry = extracted.warrantyExpiryDate?.value;
      const hasDetectedWarranty = Boolean(extractedWarrantyMonths || extractedWarrantyExpiry);

      const aiTitle = cleanFieldValue(extracted.title?.value);
      const aiMerchant = cleanFieldValue(extracted.merchant?.value);
      const cleanTitle = aiTitle || aiMerchant || derivedTitle;
      const cleanMerchant = aiMerchant || aiTitle || derivedTitle;
      const formattedDate = formatDateString(extracted.purchaseDate?.value);

      setFormData({
        title: cleanTitle,
        merchant: cleanMerchant,
        merchantProvenance: extracted.merchant?.value ? 'AI' : 'MANUAL',
        amount: extracted.amount?.value ? String(extracted.amount.value) : '',
        amountProvenance: extracted.amount?.value ? 'AI' : 'MANUAL',
        currency: extracted.currency?.value || 'INR',
        purchaseDate: formattedDate || '',
        category: extracted.category?.value && RECEIPT_CATEGORIES.includes(extracted.category.value)
          ? extracted.category.value
          : 'Other',
        notes: extracted.notes?.value || '',
        invoiceNumber: extracted.invoiceNumber?.value || '',
        hasWarranty: hasDetectedWarranty,
        warrantyMonths: hasDetectedWarranty && extractedWarrantyMonths ? String(extractedWarrantyMonths) : '',
        warrantyExpiryDate: hasDetectedWarranty && extractedWarrantyExpiry ? formatDateString(extractedWarrantyExpiry) : '',
        warrantySource: hasDetectedWarranty ? (extracted.warrantySource?.value || 'DURATION') : 'NONE',
      });

      setAiExtractedSuccess(true);
      toast.success('Receipt details auto-filled by AI.');
    } catch (err) {
      setFormData({
        title: derivedTitle,
        merchant: derivedTitle,
        merchantProvenance: 'MANUAL',
        amount: '',
        amountProvenance: 'MANUAL',
        currency: 'INR',
        purchaseDate: '',
        category: 'Other',
        notes: '',
        invoiceNumber: '',
        hasWarranty: false,
        warrantyMonths: '',
        warrantyExpiryDate: '',
        warrantySource: 'NONE',
      });
      setAiExtractedSuccess(false);
    } finally {
      setAiParsing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!isEdit && !file) {
      setFormError('Please select a receipt document or image.');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    if (!formData.merchant.trim()) {
      setFormError('Merchant name is required.');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setFormError('Amount must be a non-negative number.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      merchant: formData.merchant.trim(),
      merchantProvenance: formData.merchantProvenance,
      amount: numAmount,
      amountProvenance: formData.amountProvenance,
      currency: formData.currency,
      purchaseDate: formData.purchaseDate || null,
      category: formData.category,
      notes: formData.notes.trim() || null,
      invoiceNumber: formData.invoiceNumber.trim() || null,
      file,
      warrantyMonths: formData.hasWarranty && formData.warrantyMonths ? parseInt(formData.warrantyMonths, 10) : null,
      warrantyExpiryDate: formData.hasWarranty && formData.warrantyExpiryDate ? formData.warrantyExpiryDate : null,
      warrantySource: formData.hasWarranty ? formData.warrantySource : 'NONE',
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && <ErrorMessage message={formError} />}

      {!isEdit && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            RECEIPT FILE (IMAGE, PDF, OR WORD) <span className="text-red-500">*</span>
          </label>
          <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={loading || aiParsing}
            />

            {aiParsing ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-700">Analyzing receipt document with AI...</p>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center space-x-3 text-sm text-slate-800 bg-slate-100 border border-slate-200 py-2 px-4 rounded-lg inline-flex max-w-full truncate">
                <svg className="w-5 h-5 flex-shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Ready</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-slate-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    <span className="text-emerald-600 hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, PNG, JPG, WEBP, or DOCX (Max 10MB)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {aiExtractedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs font-medium text-emerald-800">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Details automatically extracted by AI. You can review or edit any field below.</span>
        </div>
      )}

      {filePreview && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex justify-center items-center p-2">
          <img src={filePreview} alt="Receipt preview" className="max-h-44 object-contain rounded-lg" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Samsung 55 Inch TV"
            className="text-base sm:text-sm min-h-[44px]"
            required
            disabled={loading || aiParsing}
          />
        </div>

        <div>
          <Input
            label="Merchant Name"
            name="merchant"
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            placeholder="e.g. Croma, Reliance Digital, Flipkart"
            className="text-base sm:text-sm min-h-[44px]"
            required
            disabled={loading || aiParsing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="text-base sm:text-sm min-h-[44px]"
            required
            disabled={loading || aiParsing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            disabled={loading || aiParsing}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div>
          <Input
            label="Purchase Date"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            required
            disabled={loading || aiParsing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={loading || aiParsing}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
          >
            {RECEIPT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Invoice Number (Optional)"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            placeholder="e.g. INV-2026-90182"
            disabled={loading || aiParsing}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasWarranty"
            checked={formData.hasWarranty}
            onChange={(e) => setFormData({ ...formData, hasWarranty: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            disabled={loading || aiParsing}
          />
          <label htmlFor="hasWarranty" className="text-sm font-medium text-slate-700 cursor-pointer">
            Document Contains Warranty Coverage
          </label>
        </div>

        {formData.hasWarranty && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fadeIn">
            <div>
              <Input
                label="Warranty Months"
                name="warrantyMonths"
                type="number"
                min="0"
                value={formData.warrantyMonths}
                onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                placeholder="e.g. 12 or 24"
                disabled={loading || aiParsing}
              />
            </div>

            <div>
              <Input
                label="Warranty Expiry Date"
                name="warrantyExpiryDate"
                type="date"
                value={formData.warrantyExpiryDate}
                onChange={(e) => setFormData({ ...formData, warrantyExpiryDate: e.target.value })}
                disabled={loading || aiParsing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Warranty Info Source</label>
              <select
                name="warrantySource"
                value={formData.warrantySource}
                onChange={(e) => setFormData({ ...formData, warrantySource: e.target.value })}
                disabled={loading || aiParsing}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
              >
                {WARRANTY_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          NOTES (OPTIONAL)
        </label>
        <textarea
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Warranty details, order ID, or notes..."
          disabled={loading || aiParsing}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading || aiParsing}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || aiParsing}>
          {loading ? 'Saving...' : isEdit ? 'Update Receipt' : 'Save Receipt'}
        </Button>
      </div>
    </form>
  );
};
