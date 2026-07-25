import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptForm } from '../components/receipt/ReceiptForm';
import { receiptService } from '../services/receiptService';
import { ROUTES } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const UploadReceipt = () => {
  useDocumentTitle('Upload Receipt');
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');
      await receiptService.createReceipt(formData);
      toast.success('Receipt uploaded successfully.');
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 300);
    } catch (err) {
      const errMsg = err?.message || "We couldn't upload your receipt. Please check your file and try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload Receipt</h1>
        <p className="text-sm text-slate-600">
          Store an image or PDF of your receipt and enter its purchase details.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200" role="alert">
          {error}
        </div>
      )}

      <ReceiptForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};
