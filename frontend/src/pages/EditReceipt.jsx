import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReceiptForm } from '../components/receipt/ReceiptForm';
import { receiptService } from '../services/receiptService';
import { ROUTES } from '../utils/constants';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const EditReceipt = () => {
  useDocumentTitle('Edit Receipt');
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [receipt, setReceipt] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setInitialLoading(true);
        const data = await receiptService.getReceiptById(id);
        setReceipt(data.receipt);
      } catch (err) {
        const errMsg = err?.message || "We couldn't load this receipt's details.";
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      setError('');
      await receiptService.updateReceipt(id, formData);
      toast.success('Changes saved.');
      navigate(ROUTES.RECEIPT_DETAIL(id));
    } catch (err) {
      const errMsg = err?.message || "We couldn't save your changes. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Receipt Details</h1>
        <p className="text-sm text-slate-600">
          Update purchase information or replace the attached receipt document.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200" role="alert">
          {error}
        </div>
      )}

      {initialLoading ? (
        <Card className="p-8 text-center animate-pulse">
          <p className="text-xs font-semibold text-slate-500">Finding your receipt details...</p>
        </Card>
      ) : (
        <ReceiptForm
          initialData={receipt}
          onSubmit={handleSubmit}
          isEdit={true}
          loading={submitLoading}
        />
      )}
    </div>
  );
};
