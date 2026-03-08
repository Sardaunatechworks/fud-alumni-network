import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signUp } from '../lib/db';

export default function AlumniSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    state: '',
    graduationYear: '',
    faculty: 'Science',
    department: '',
    expertise: '',
    skills: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

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
      role: 'alumni',
      status: 'pending',
      department: formData.department,
      faculty: formData.faculty,
      graduation_year: formData.graduationYear,
      expertise: formData.expertise,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    
    if (!data?.session) {
      setSuccess('Registration successful! Please check your email to verify your account before logging in or waiting for admin approval.');
      return;
    }

    navigate('/pending-approval');
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-3xl"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-900">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-900 text-white shadow-lg">
              <Briefcase size={28} />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Alumni Registration</h2>
          <p className="mt-2 text-sm text-slate-600">
            Share your expertise and mentor the next generation of FUD graduates
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
                  <AlertCircle size={16} />{success}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="sm:col-span-2">
              <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    required 
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="Dr. Jane Smith" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="jane.smith@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">State of Residence</label>
                  <input 
                    type="text" 
                    name="state"
                    required 
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="Jigawa" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Year of Graduation</label>
                  <input 
                    type="number" 
                    name="graduationYear"
                    required 
                    value={formData.graduationYear}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="2015" 
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <h3 className="mt-4 text-lg font-bold text-slate-900">Academic & Professional</h3>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Faculty</label>
                  <select 
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900"
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
                  <label className="block text-sm font-semibold text-slate-700">Department</label>
                  <input 
                    type="text" 
                    name="department"
                    required 
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="Biological Sciences" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Area of Expertise / Industry</label>
                  <input 
                    type="text" 
                    name="expertise"
                    required 
                    value={formData.expertise}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="Software Engineering" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Skills (Comma separated)</label>
                  <input 
                    type="text" 
                    name="skills"
                    required 
                    value={formData.skills}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900" 
                    placeholder="Python, Leadership, Research" 
                  />
                </div>
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
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-indigo-900"
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
                className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-900 focus:bg-white focus:ring-indigo-900"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-900 px-4 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-indigo-800 hover:shadow-xl disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Submittingâ€¦' : 'Submit for Approval'}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                By submitting, you agree to our terms and conditions for alumni mentors.
              </p>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-600">Already have an account?</span>{' '}
            <Link to="/login" className="font-bold text-indigo-900 hover:text-indigo-800">
              Login here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

