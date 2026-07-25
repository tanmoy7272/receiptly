import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DashboardSkeleton } from './components/dashboard/DashboardSkeleton';
import { ReceiptSkeleton } from './components/receipt/ReceiptSkeleton';
import { Card } from './components/ui/Card';
import { ROUTES } from './utils/constants';

// Code Splitting with React.lazy
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ReceiptList = lazy(() => import('./pages/ReceiptList').then((m) => ({ default: m.ReceiptList })));
const UploadReceipt = lazy(() => import('./pages/UploadReceipt').then((m) => ({ default: m.UploadReceipt })));
const ReceiptDetail = lazy(() => import('./pages/ReceiptDetail').then((m) => ({ default: m.ReceiptDetail })));
const EditReceipt = lazy(() => import('./pages/EditReceipt').then((m) => ({ default: m.EditReceipt })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Helper for preloading Dashboard chunk after auth
export const preloadDashboard = () => {
  import('./pages/Dashboard');
};

const GenericPageFallback = () => (
  <div className="mx-auto max-w-4xl px-4 py-12 text-center">
    <Card className="py-12 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 rounded mx-auto mb-3" />
      <div className="h-4 w-64 bg-slate-100 rounded mx-auto" />
    </Card>
  </div>
);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path={ROUTES.HOME} element={<MainLayout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<GenericPageFallback />}>
                      <Landing />
                    </Suspense>
                  }
                />
                <Route
                  path={ROUTES.LOGIN}
                  element={
                    <Suspense fallback={<GenericPageFallback />}>
                      <Login />
                    </Suspense>
                  }
                />
                <Route
                  path={ROUTES.REGISTER}
                  element={
                    <Suspense fallback={<GenericPageFallback />}>
                      <Register />
                    </Suspense>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<DashboardSkeleton />}>
                        <Dashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.RECEIPTS}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<ReceiptSkeleton count={6} />}>
                        <ReceiptList />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.RECEIPT_NEW}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<GenericPageFallback />}>
                        <UploadReceipt />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts/:id"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<GenericPageFallback />}>
                        <ReceiptDetail />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts/:id/edit"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<GenericPageFallback />}>
                        <EditReceipt />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <Suspense fallback={<GenericPageFallback />}>
                      <NotFound />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
