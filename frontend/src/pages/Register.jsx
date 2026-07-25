import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Loader2, Lock, Mail, User, ShieldCheck, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { preloadDashboard } from '../App';
import { authService } from '../services/authService';

export const Register = () => {
  useDocumentTitle('Create Account');
  const navigate = useNavigate();
  const { register, login, isAuthenticated } = useAuth();
  const toast = useToast();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      const msg = 'Please enter your full name.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!formData.email.trim()) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (formData.password.length < 8) {
      const msg = 'Please choose a password with at least 8 characters.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      const data = await register(formData);

      if (data?.requiresVerification) {
        // Transition to OTP verification step
        setVerificationEmail(data.email);
        setVerificationStep(true);
        setResendCooldown(60);
        toast.success('Verification code sent to your email.');
      } else if (data?.user && data?.token) {
        // Fallback: if backend ever returns token directly (shouldn't happen with new flow)
        preloadDashboard();
        toast.success('Your account has been created successfully!');
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    } catch (err) {
      const errMsg = err?.message || 'We could not create your account. Please review your details and try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // single digit
    setOtp(newOtp);
    if (error) setError('');

    // Auto-focus next input
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
      const newOtp = pasted.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      const msg = 'Please enter the 6-digit verification code.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setVerifying(true);
      setError('');
      const data = await authService.verifyEmail({ email: verificationEmail, otp: code });

      if (data?.token && data?.user) {
        localStorage.setItem('receiptly_token', data.token);
        preloadDashboard();
        toast.success('Email verified! Welcome to Receiptly.');
        // Use login context to set user state, then navigate
        // Since verify-email returns token+user, we set them directly via a page reload approach
        window.location.href = ROUTES.DASHBOARD;
      }
    } catch (err) {
      const errMsg = err?.message || 'Verification failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setError('');
      await authService.resendOtp({ email: verificationEmail, purpose: 'EMAIL_VERIFICATION' });
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('A new verification code has been sent.');
      otpRefs.current[0]?.focus();
    } catch (err) {
      const errMsg = err?.message || 'Could not resend code. Please try again.';
      toast.error(errMsg);
    }
  };

  // ---------------------------------------------------------------------------
  // OTP Verification Step
  // ---------------------------------------------------------------------------
  if (verificationStep) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ShieldCheck className="h-6 w-6 text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-900">{verificationEmail}</span>
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-subtle">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
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
              disabled={verifying || otp.join('').length !== 6}
              className="w-full justify-center py-2.5 font-semibold text-sm gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify Email <ArrowRight className="h-4 w-4" />
                </>
              )}
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
            <p className="text-xs text-slate-500">
              Code expires in 5 minutes.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Registration Form (existing, unchanged)
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Get started with Receiptly
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create your account to organize all your receipts in one place.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border-slate-200 shadow-subtle">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="name"
                type="text"
                required
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password (8+ characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
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
                <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
