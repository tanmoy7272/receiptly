import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, FolderLock, ArrowRight, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const Landing = () => {
  useDocumentTitle('Store every receipt. Find it in seconds.');
  const { isAuthenticated } = useAuth();

  const supportedReceipts = [
    'Amazon Purchases', 'Swiggy & Zomato Bills', 'Blinkit Groceries', 'Flipkart Orders', 
    'Electricity & Water Bills', 'Hotel Invoices', 'Flight Tickets', 'Tuition Fee Receipts'
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-12 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>AI-Assisted Document Vault</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Store every receipt.{' '}
            <span className="block text-slate-700">Find it in seconds.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
            Receiptly is your secure personal vault for purchase receipts, utility bills, travel invoices, and fee receipts. Never lose a warranty or tax proof again.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isAuthenticated ? (
              <>
                <Link to={ROUTES.DASHBOARD}>
                  <Button size="lg" variant="primary" className="w-full sm:w-auto gap-2">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={ROUTES.RECEIPT_NEW}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    <Upload className="h-4 w-4 text-slate-600" /> Upload Receipt
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg" variant="primary" className="w-full sm:w-auto gap-2">
                    Create Free Account <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In to Vault
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 space-y-3 border-slate-200 shadow-subtle">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <FolderLock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Secure Central Vault</h3>
            <p className="text-xs text-slate-600">
              Keep image and PDF receipts organized permanently with instant cloud access whenever you need them.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-slate-200 shadow-subtle">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Instant Smart Search</h3>
            <p className="text-xs text-slate-600">
              Search by merchant name, title, date range, amount, or notes to locate any receipt in seconds.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-slate-200 shadow-subtle sm:col-span-2 lg:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Extraction Pipeline</h3>
            <p className="text-xs text-slate-600">
              Automatically extract merchant, purchase date, total amount, and categories using document intelligence.
            </p>
          </Card>
        </div>
      </section>

      {/* Supported Documents List */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <Card className="p-8 bg-slate-50 border-slate-200 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Designed for All Your Documents</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-left">
            {supportedReceipts.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};
