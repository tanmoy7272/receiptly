import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileQuestion,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ReceiptCard } from '../components/receipt/ReceiptCard';
import { ReceiptSkeleton } from '../components/receipt/ReceiptSkeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDebounce } from '../hooks/useDebounce';
import { receiptService } from '../services/receiptService';
import { ROUTES, RECEIPT_CATEGORIES, SUPPORTED_CURRENCIES } from '../utils/constants';

export const ReceiptList = () => {
  useDocumentTitle('All Receipts');
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [deleteReceiptId, setDeleteReceiptId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const category = searchParams.get('category') || '';
  const currency = searchParams.get('currency') || '';
  const fromDate = searchParams.get('fromDate') || '';
  const toDate = searchParams.get('toDate') || '';
  const minAmount = searchParams.get('minAmount') || '';
  const maxAmount = searchParams.get('maxAmount') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const currentSearchInUrl = searchParams.get('search') || '';
    if (debouncedSearch !== currentSearchInUrl) {
      updateUrlParams({ search: debouncedSearch, page: '1' });
    }
  }, [debouncedSearch]);

  const updateUrlParams = (newParams) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          updated.set(key, value);
        } else {
          updated.delete(key);
        }
      });
      return updated;
    });
  };

  const handleFilterChange = (key, value) => {
    updateUrlParams({ [key]: value, page: '1' });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const fetchReceipts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError('');

      const queryParams = {
        search: debouncedSearch,
        category,
        currency,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        sortBy,
        page,
        limit: 10,
      };

      const data = await receiptService.getReceipts(queryParams, controller.signal);
      setReceipts(data.receipts || []);
      setPagination(
        data.pagination || { totalItems: 0, currentPage: 1, totalPages: 1, pageSize: 10 }
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        const msg = err?.message || 'We could not load your receipts right now. Please try again.';
        setError(msg);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, category, currency, fromDate, toDate, minAmount, maxAmount, sortBy, page]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const confirmDeleteReceipt = async () => {
    if (!deleteReceiptId) return;
    try {
      setDeleting(true);
      await receiptService.deleteReceipt(deleteReceiptId);
      toast.success('Receipt deleted.');
      setDeleteReceiptId(null);
      fetchReceipts();
    } catch (err) {
      toast.error(err?.message || "We couldn't delete this receipt right now.");
    } finally {
      setDeleting(false);
    }
  };

  const isFiltered = Boolean(
    debouncedSearch || category || currency || fromDate || toDate || minAmount || maxAmount
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Receipts</h1>
          <p className="text-sm text-slate-600">
            {loading ? (
              'Finding your receipts...'
            ) : (
              <span>
                Showing <span className="font-semibold text-slate-900">{receipts.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalItems}</span> receipts
              </span>
            )}
          </p>
        </div>
        <Link to={ROUTES.RECEIPT_NEW}>
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" /> Upload Receipt
          </Button>
        </Link>
      </div>

      {/* Search & Filter Controls Card */}
      <Card className="mb-8 p-4 sm:p-5 space-y-4 border-slate-200 shadow-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, merchant, or notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateUrlParams({ search: '', page: '1' });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-48">
            <select
              value={category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">All Categories</option>
              {RECEIPT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
              <option value="merchant_asc">Merchant A-Z</option>
              <option value="merchant_desc">Merchant Z-A</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showAdvancedFilters ? 'secondary' : 'outline'}
              size="md"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-1.5"
            >
              <Filter className="h-4 w-4 text-slate-500" />
              Filters
            </Button>

            {isFiltered && (
              <Button
                variant="ghost"
                size="md"
                onClick={handleClearFilters}
                className="gap-1.5 text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid gap-3 pt-3 border-t border-slate-200 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="">All Currencies</option>
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleteReceiptId)}
        title="Delete this receipt?"
        message="This action can't be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteReceipt}
        onCancel={() => setDeleteReceiptId(null)}
      />

      {/* Main Results View */}
      {loading ? (
        <ReceiptSkeleton count={6} />
      ) : error ? (
        <ErrorMessage
          title="Unable to load receipts"
          message={error}
          onRetry={fetchReceipts}
        />
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title={isFiltered ? 'No receipts matched your search or active filters.' : 'Your receipts will appear here once you upload your first one.'}
          description={
            isFiltered
              ? 'Try adjusting your search query, dates, or clearing active filters.'
              : 'Upload purchase invoices, bills, or fee receipts to keep your documents organized forever.'
          }
          primaryActionText={isFiltered ? 'Clear Filters' : '+ Upload Receipt'}
          onPrimaryAction={isFiltered ? handleClearFilters : () => window.location.href = ROUTES.RECEIPT_NEW}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onDelete={(id) => setDeleteReceiptId(id)}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-xs font-medium text-slate-600">
                Page <span className="font-semibold text-slate-900">{pagination.currentPage}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => updateUrlParams({ page: (pagination.currentPage - 1).toString() })}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => updateUrlParams({ page: (pagination.currentPage + 1).toString() })}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
