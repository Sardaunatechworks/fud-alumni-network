import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signIn, getUserById, signOut } from '../lib/db';
import { useAuth } from '../lib/authContext';
import { useEffect } from 'react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  // If already logged in, redirect to the correct dashboard
  useEffect(() => {
    if (!authLoading && profile) {
      const dashboards = {
        student: '/dashboard/student',
        alumni: '/dashboard/alumni',
        admin: '/dashboard/admin',
      };
      navigate(dashboards[profile.role], { replace: true });
    }
  }, [profile, authLoading, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Check if the profile entry exists. Manual Supabase dashboard users might be missing this.
      const profileData = await getUserById(data.user.id);
      if (!profileData) {
        await signOut();
        setError("Account incomplete: Profile missing. If you are an admin, please use /signup/admin to initialize your account.");
        setLoading(false);
        return;
      }

      // Profile exists, let useEffect handle the redirect via useAuth
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary shadow-lg">
              <GraduationCap size={28} />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to your FUD Alumni account</p>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 ring-1 ring-red-100"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition-all focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition-all focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-primary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Don't have an account?</span>{' '}
            <Link to="/signup/student" className="font-bold text-primary hover:text-primary-dark">
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
