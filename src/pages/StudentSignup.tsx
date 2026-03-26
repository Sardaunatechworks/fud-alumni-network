import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signUp } from '../lib/db';

export default function StudentSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    faculty: 'Science',
    level: '100 Level',
    interests: [] as string[],
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  const interestsOptions = ['Coding', 'Data Science', 'AI', 'Cybersecurity', 'Business', 'Design', 'Marketing'];

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { data, error: authError } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      role: 'student',
      status: 'active',
      department: formData.department,
      faculty: formData.faculty,
      level: formData.level,
      interests: formData.interests,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    
    if (!data?.session) {
      setSuccess('Registration successful! Please check your email to verify your account before logging in.');
      return;
    }

    navigate('/dashboard/student');
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-2xl"
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
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Student Registration</h2>
          <p className="mt-2 text-sm text-slate-600">
            Join the network and start your journey with expert guidance
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-12">
          <form className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8" onSubmit={handleSubmit}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 ring-1 ring-red-100"
                >
                  <AlertCircle size={16} />{error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700 ring-1 ring-green-200"
                >
                  <Check size={16} />{success}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                placeholder="john@fud.edu.ng"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-slate-700">
                Department
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                placeholder="e.g. Computer Science"
              />
            </div>

            <div>
              <label htmlFor="faculty" className="block text-sm font-semibold text-slate-700">
                Faculty
              </label>
              <select 
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
              >
                                <option>Science</option>
                <option>Computing</option>
                <option>Engineering</option>
                <option>Arts &amp; Education</option>
                <option>Agriculture</option>
                <option>Management &amp; Social Sciences</option>
                <option>Law</option>
              </select>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-semibold text-slate-700">
                Current Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
              >
                <option>100 Level</option>
                <option>200 Level</option>
                <option>300 Level</option>
                <option>400 Level</option>
                <option>500 Level</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Areas of Interest</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {interestsOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {formData.interests.includes(interest) && <Check size={12} />}
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:bg-white focus:ring-primary sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Creating Account…' : 'Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-600">Already have an account?</span>{' '}
            <Link to="/login" className="font-bold text-primary hover:text-primary-dark">
              Login here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

