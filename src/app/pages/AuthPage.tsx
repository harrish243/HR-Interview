import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mail, Lock, CheckCircle, AlertCircle, ChevronRight, UserPlus, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';
type ForgotStep = 'email' | 'verify' | 'reset' | 'done';
type SignupStep = 'email' | 'verify' | 'password';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const resetAll = () => {
    setEmail('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setSignupStep('email');
    setForgotStep('email');
    setMessage({ type: '', text: '' });
  };

  const switchMode = (m: AuthMode) => {
    resetAll();
    setMode(m);
  };

  // ── LOGIN ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('userEmail', email);
        navigate('/dashboard');
      } else if (data.noAccount) {
        setMessage({ type: 'warning', text: 'No account found. Switching to Sign Up.' });
        switchMode('signup');
      } else {
        setMessage({ type: 'error', text: data.message || 'Incorrect password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP ─────────────────────────────────────────────
  const requestSignupCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('http://localhost:5000/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSignupStep('verify');
        setMessage({ type: 'success', text: `Verification code sent to ${email}` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send code.' });
        if (data.exists) switchMode('login');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send code.' });
    } finally {
      setLoading(false);
    }
  };

  const verifySignupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (data.success) {
        setSignupStep('password');
        setMessage({ type: 'success', text: 'Email verified! Set your password.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Invalid code.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verification error.' });
    } finally {
      setLoading(false);
    }
  };

  const finalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('userEmail', email);
        setMessage({ type: 'success', text: 'Account created! Welcome.' });
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD ────────────────────────────────────
  const requestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep('verify');
        setMessage({ type: 'success', text: `Reset code sent to ${email}` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send reset code.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send reset code.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep('reset');
        setMessage({ type: 'success', text: 'Code verified! Set your new password.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Invalid code.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verification error.' });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please try again.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep('done');
        setMessage({ type: 'success', text: 'Password reset successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  // ── SHARED MESSAGE BANNER ──────────────────────────────
  const MessageBanner = () => message.text ? (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
        message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
        message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' :
        'bg-amber-50 text-amber-600 border border-amber-100'
      }`}
    >
      {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
      <span className="text-sm font-semibold">{message.text}</span>
    </motion.div>
  ) : null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Branding Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-indigo-900 to-indigo-950 p-16 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <span className="text-4xl font-bold text-white">InterviewAI</span>
          </div>
          <h1 className="text-6xl font-black text-white mb-8 leading-tight">
            Your Career,<br />
            <span className="text-secondary">AI Empowered.</span>
          </h1>
          <p className="text-xl text-indigo-100/80 leading-relaxed max-w-md">
            Practice with our advanced interviewer. Real questions. Real feedback. Real success.
          </p>
        </div>
        <div className="relative z-10 text-white/40 text-sm">© 2026 InterviewAI. All rights reserved.</div>
      </motion.div>

      {/* ── Auth Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md py-8">

          {/* Tab switcher — only for login / signup */}
          {mode !== 'forgot' && (
            <div className="flex gap-2 bg-muted p-1.5 rounded-2xl mb-10 shadow-inner">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'login' ? 'bg-white shadow-md text-primary' : 'text-muted-foreground'}`}
              >Log In</button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'signup' ? 'bg-white shadow-md text-primary' : 'text-muted-foreground'}`}
              >Sign Up</button>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ══════════════ LOGIN ══════════════ */}
            {mode === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl font-black text-foreground mb-1">Welcome back</h2>
                <p className="text-muted-foreground mb-8">Ready for your next practice session?</p>

                <MessageBanner />

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@gmail.com"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-input outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold">Password</label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-bold text-primary hover:text-indigo-700 transition-colors hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-input outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Logging in...' : 'Enter Dashboard'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ══════════════ SIGN UP ══════════════ */}
            {mode === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl font-black text-foreground mb-1">Create account</h2>
                <p className="text-muted-foreground mb-6">Set up your account in simple steps.</p>

                <MessageBanner />

                <div className="space-y-5">
                  {/* Step 1 – Email */}
                  <form onSubmit={requestSignupCode} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold">Email Address</label>
                        {signupStep !== 'email' && (
                          <button type="button" onClick={() => { setSignupStep('email'); setVerificationCode(''); setMessage({ type: '', text: '' }); }}
                            className="text-xs font-bold text-primary hover:underline">Change Email</button>
                        )}
                      </div>
                      <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${signupStep !== 'email' ? 'text-green-500' : 'text-muted-foreground'}`} size={20} />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={signupStep !== 'email'} placeholder="you@gmail.com"
                          className={`w-full pl-12 pr-10 py-4 rounded-xl border outline-none focus:ring-2 focus:ring-primary/20 bg-white transition-all ${signupStep !== 'email' ? 'border-green-200 bg-green-50/30 cursor-not-allowed text-gray-500' : 'border-input'}`} />
                        {signupStep !== 'email' && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />}
                      </div>
                    </div>
                    {signupStep === 'email' && (
                      <button type="submit" disabled={loading}
                        className="w-full py-4 bg-secondary text-primary rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3">
                        {loading ? 'Sending...' : 'Send Verification Code'} <ChevronRight size={20} />
                      </button>
                    )}
                  </form>

                  {/* Step 2 – Verify Code */}
                  <AnimatePresence>
                    {signupStep !== 'email' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <form onSubmit={verifySignupCode} className="space-y-4 pt-2">
                          <hr className="border-muted/50" />
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-bold">Verification Code</label>
                            {signupStep === 'password' && (
                              <span className="text-xs font-bold text-green-600 flex items-center gap-1">Verified <CheckCircle size={12} /></span>
                            )}
                          </div>
                          <input type="text" maxLength={6} value={verificationCode} onChange={e => setVerificationCode(e.target.value)}
                            required disabled={signupStep === 'password'} placeholder="000000"
                            className={`w-full text-center text-3xl tracking-[0.5rem] font-black py-4 rounded-xl border-2 outline-none bg-white transition-all ${signupStep === 'password' ? 'border-green-200 bg-green-50/30 cursor-not-allowed text-gray-400' : 'border-primary/20 focus:border-secondary'}`} />
                          {signupStep === 'verify' && (
                            <div className="space-y-3">
                              <button type="submit" disabled={loading}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all">
                                {loading ? 'Verifying...' : 'Verify Code'}
                              </button>
                              <button type="button" onClick={() => requestSignupCode()} className="w-full text-sm font-bold text-muted-foreground hover:text-primary text-center">
                                Didn't receive the code? Resend
                              </button>
                            </div>
                          )}
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 3 – Set Password */}
                  <AnimatePresence>
                    {signupStep === 'password' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <form onSubmit={finalizeRegistration} className="space-y-4 pt-2">
                          <hr className="border-muted/50" />
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                              <UserPlus className="text-green-600" size={20} />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-foreground">Set your password</h3>
                              <p className="text-xs text-muted-foreground">Secure your new InterviewAI account</p>
                            </div>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a password (min 6 chars)"
                              className="w-full pl-12 pr-4 py-4 rounded-xl border border-input outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                          </div>
                          <button type="submit" disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all">
                            {loading ? 'Creating Account...' : 'Finish & Enter Dashboard'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ══════════════ FORGOT PASSWORD ══════════════ */}
            {mode === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                {/* Back button */}
                <button onClick={() => switchMode('login')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8">
                  <ArrowLeft size={16} /> Back to Login
                </button>

                {forgotStep !== 'done' && (
                  <>
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                      <KeyRound className="text-amber-600" size={28} />
                    </div>
                    <h2 className="text-4xl font-black text-foreground mb-1">Forgot password?</h2>
                    <p className="text-muted-foreground mb-8">
                      {forgotStep === 'email' && "Enter your registered email and we'll send a reset code."}
                      {forgotStep === 'verify' && <>Enter the 6-digit code sent to <strong>{email}</strong></>}
                      {forgotStep === 'reset' && 'Create a strong new password for your account.'}
                    </p>
                  </>
                )}

                <MessageBanner />

                <div className="space-y-5">

                  {/* Forgot Step 1 – Email */}
                  {forgotStep === 'email' && (
                    <form onSubmit={requestResetCode} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold mb-2">Registered Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@gmail.com"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-input outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                        </div>
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 hover:shadow-xl transition-all flex items-center justify-center gap-3">
                        {loading ? 'Sending...' : 'Send Reset Code'} <ChevronRight size={20} />
                      </button>
                    </form>
                  )}

                  {/* Forgot Step 2 – Verify Code */}
                  {forgotStep === 'verify' && (
                    <form onSubmit={verifyResetCode} className="space-y-5">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold">Verification Code</label>
                          <button type="button" onClick={() => setForgotStep('email')} className="text-xs font-bold text-primary hover:underline">
                            Wrong email?
                          </button>
                        </div>
                        <input type="text" maxLength={6} value={verificationCode} onChange={e => setVerificationCode(e.target.value)}
                          required placeholder="000000"
                          className="w-full text-center text-3xl tracking-[0.5rem] font-black py-4 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-400 bg-white" />
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 hover:shadow-xl transition-all">
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                      <button type="button" onClick={requestResetCode} className="w-full text-sm font-bold text-muted-foreground hover:text-primary text-center">
                        Didn't receive the code? Resend
                      </button>
                    </form>
                  )}

                  {/* Forgot Step 3 – New Password */}
                  {forgotStep === 'reset' && (
                    <form onSubmit={submitNewPassword} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold mb-2">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="New password (min 6 chars)"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-input outline-none focus:ring-2 focus:ring-amber-200 bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat new password"
                            className={`w-full pl-12 pr-4 py-4 rounded-xl border outline-none focus:ring-2 bg-white transition-all ${
                              confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-input focus:ring-amber-200'
                            }`} />
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle size={12} /> Passwords do not match</p>
                        )}
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 hover:shadow-xl transition-all">
                        {loading ? 'Saving...' : 'Reset Password'}
                      </button>
                    </form>
                  )}

                  {/* Forgot Step 4 – Success */}
                  {forgotStep === 'done' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="text-green-500" size={40} />
                      </div>
                      <h2 className="text-3xl font-black text-foreground mb-2">Password Reset!</h2>
                      <p className="text-muted-foreground mb-8">Your password has been successfully updated. You can now log in with your new password.</p>
                      <button onClick={() => switchMode('login')}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all">
                        Back to Log In
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
