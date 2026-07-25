import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Lock, Mail, ShieldCheck, RotateCcw, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';

export const ForgotPassword = () => {
  useDocumentTitle('Reset Password');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Steps: 'email' -> 'otp' -> 'reset'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // --- Step 1: Submit email ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      const msg = 'Please enter your email address.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword({ email });
      setStep('otp');
      setResendCooldown(60);
      toast.success('If an account exists, a reset code has been sent.');
    } catch (err) {
      const errMsg = err?.message || 'Something went wrong. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- OTP input handlers ---
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (error) setError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // --- Step 2: Verify OTP -> move to reset step ---
  const handleOtpSubmit = async (e) => {
    e?.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      const msg = 'Please enter the 6-digit verification code.';
      setError(msg);
      toast.error(msg);
      return;
    }

    // Move to reset step with the verified OTP
    // The actual OTP verification happens server-side during password reset
    setStep('reset');
    setError('');
  };

  // --- Step 3: Reset password ---
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword({ email, otp: otp.join(''), newPassword });
      toast.success('Password reset successful! You can now sign in.');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const errMsg = err?.message || 'Password reset failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
      // If OTP was invalid, go back to OTP step
      if (errMsg.toLowerCase().includes('verification code') || errMsg.toLowerCase().includes('expired')) {
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setError('');
      await authService.resendOtp({ email, purpose: 'PASSWORD_RESET' });
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('A new reset code has been sent.');
      otpRefs.current[0]?.focus();
    } catch (err) {
      const errMsg = err?.message || 'Could not resend code. Please try again.';
      toast.error(errMsg);
    }
  };

  // =========================================================================
  // Step 1: Email
  // =========================================================================
  if (step === 'email') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <KeyRound className="h-6 w-6 text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the email address associated with your account and we'll send you a verification code.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-subtle">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center py-2.5 font-semibold text-sm gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending code...
                </>
              ) : (
                <>
                  Send Reset Code <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // Step 2: OTP Verification
  // =========================================================================
  if (step === 'otp') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ShieldCheck className="h-6 w-6 text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Enter verification code
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-900">{email}</span>
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-subtle">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 text-center">
                Verification Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-12 w-12 rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={otp.join('').length !== 6}
              className="w-full justify-center py-2.5 font-semibold text-sm gap-2"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            >
              <RotateCcw className="h-3 w-3" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">Code expires in 5 minutes.</p>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // Step 3: New Password
  // =========================================================================
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Lock className="h-6 w-6 text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a strong password for your account.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border-slate-200 shadow-subtle">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password (8+ characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (error) setError(''); }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full justify-center py-2.5 font-semibold text-sm gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Resetting password...
              </>
            ) : (
              <>
                Reset Password <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};
