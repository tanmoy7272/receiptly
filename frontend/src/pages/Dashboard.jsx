import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  UploadCloud,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  Receipt as ReceiptIcon,
  Wallet,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ReceiptCard } from '../components/receipt/ReceiptCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { dashboardService } from '../services/dashboardService';
import { receiptService } from '../services/receiptService';
import { ROUTES } from '../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard = () => {
  useDocumentTitle('Dashboard');
  const { user, logout } = useAuth();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteReceiptId, setDeleteReceiptId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      const msg = err?.message || 'Unable to load dashboard right now. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const confirmDeleteReceipt = async () => {
    if (!deleteReceiptId) return;
    try {
      setDeleting(true);
      await receiptService.deleteReceipt(deleteReceiptId);
      toast.success('Receipt deleted.');
      setDeleteReceiptId(null);
      fetchDashboard();
    } catch (err) {
      toast.error(err?.message || "We couldn't delete this receipt right now.");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const overview = dashboardData?.overview || {};
  const recentReceipts = dashboardData?.recentReceipts || [];
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];
  const monthlySpending = dashboardData?.monthlySpending || [];

  const totalReceipts = overview.totalReceipts || 0;

  const chartLabels = monthlySpending.map((m) => m.month);
  const chartDataValues = monthlySpending.map((m) => m.totalAmount);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Monthly Spend (₹)',
        data: chartDataValues,
        borderColor: '#0f172a',
        backgroundColor: '#0f172a',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Spend: ₹${(Number(context?.raw) || 0).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#64748b' },
      },
      y: {
        border: { dash: [4, 4] },
        ticks: {
          font: { size: 12 },
          color: '#64748b',
          callback: (value) => `₹${Number(value) || 0}`,
        },
      },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Bar Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Account Owner'}
          </h1>
          <p className="text-sm text-slate-600">
            Account: <span className="font-medium text-slate-900">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link to={ROUTES.RECEIPT_NEW} className="flex-1 sm:flex-initial">
            <Button variant="primary" className="w-full justify-center gap-2">
              <Plus className="h-4 w-4" /> Upload Receipt
            </Button>
          </Link>
          <Button variant="outline" onClick={logout} className="flex-1 sm:flex-initial justify-center">
            Sign Out
          </Button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorMessage
          title="Unable to load dashboard"
          message={error}
          onRetry={fetchDashboard}
        />
      ) : totalReceipts === 0 ? (
        /* Reassuring Empty State */
        <EmptyState
          icon={UploadCloud}
          title="Your receipts will appear here once you upload your first one."
          description="Upload purchase invoices, restaurant bills, utility receipts, or fee receipts to keep your documents organized forever."
          primaryActionText="+ Upload Receipt"
          onPrimaryAction={() => window.location.href = ROUTES.RECEIPT_NEW}
        />
      ) : (
        /* Full Dashboard Layout */
        <div className="space-y-6 sm:space-y-8">
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

          {/* Overview Cards Row - Interactive Navigation Shortcuts (2x2 Grid on Mobile, 4-Cols on Desktop) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Link to={ROUTES.RECEIPTS} className="block group">
              <Card className="p-4 sm:p-5 h-full hover:border-slate-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-slate-900 transition-colors">Total Receipts</span>
                  <div className="flex items-center gap-1">
                    <ReceiptIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{overview.totalReceipts}</p>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700 transition-colors">View all in vault →</p>
              </Card>
            </Link>

            <Link to={`${ROUTES.RECEIPTS}?sortBy=amount_desc`} className="block group">
              <Card className="p-4 sm:p-5 h-full hover:border-slate-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-slate-900 transition-colors">Total Spent</span>
                  <div className="flex items-center gap-1">
                    <Wallet className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(overview.totalSpent)}</p>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700 transition-colors">All-time tracked spend</p>
              </Card>
            </Link>

            <Link to={`${ROUTES.RECEIPTS}?sortBy=amount_desc`} className="block group">
              <Card className="p-4 sm:p-5 h-full hover:border-slate-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-slate-900 transition-colors">Average Spend</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(overview.averageSpend)}</p>
                <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700 transition-colors">Per receipt average</p>
              </Card>
            </Link>

            {(() => {
              const now = new Date();
              const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
              return (
                <Link to={`${ROUTES.RECEIPTS}?fromDate=${startOfMonthStr}`} className="block group">
                  <Card className="p-4 sm:p-5 h-full hover:border-slate-400 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-slate-900 transition-colors">This Month</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(overview.thisMonthSpent)}</p>
                    <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-700 transition-colors">{overview.thisMonthReceipts} receipt(s) this month →</p>
                  </Card>
                </Link>
              );
            })()}
          </div>

          {/* Rolling 6-Month Chart & Category Breakdown */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Rolling 6-Month Spending</h2>
                  <p className="text-xs text-slate-500">Monthly expense totals</p>
                </div>
              </div>
              <div className="h-64 w-full flex-1">
                <Line data={chartData} options={chartOptions} />
              </div>
            </Card>

            <Card className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Category Breakdown</h2>
                  <p className="text-xs text-slate-500">Sorted by highest spend</p>
                </div>
                <Tag className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex-1 overflow-x-auto">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-8">No categories found</p>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <table className="hidden sm:table w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                          <th className="py-2">Category</th>
                          <th className="py-2 text-center">Count</th>
                          <th className="py-2 text-right">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {categoryBreakdown.map((cat) => (
                          <tr key={cat.category} className="hover:bg-slate-50">
                            <td className="py-2.5 font-semibold text-slate-900">{cat.category}</td>
                            <td className="py-2.5 text-center text-slate-500">{cat.receiptCount}</td>
                            <td className="py-2.5 text-right font-bold text-slate-900">
                              {formatCurrency(cat.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Cards View */}
                    <div className="block sm:hidden space-y-2.5">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{cat.category}</p>
                            <p className="text-[11px] text-slate-500">{cat.receiptCount} receipt(s)</p>
                          </div>
                          <p className="text-xs font-bold text-slate-900">{formatCurrency(cat.totalAmount)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Receipts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Receipts</h2>
                <p className="text-xs text-slate-500">Recently added to your account</p>
              </div>

              <Link
                to={ROUTES.RECEIPTS}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:underline"
              >
                View All Receipts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentReceipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onDelete={(id) => setDeleteReceiptId(id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
