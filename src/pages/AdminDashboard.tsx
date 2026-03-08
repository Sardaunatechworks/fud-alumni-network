import { useEffect, useState, FormEvent } from 'react';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  UserPlus,
  MoreVertical,
  Search,
  AlertTriangle,
  FileText,
  Lock,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  getUsers,
  updateUserStatus,
  deleteUser,
  signUp,
  updateProfile,
  getAdminConfig,
  saveAdminConfig,
  getSessions,
  getReports,
} from '../lib/db';
import { signOut } from '../lib/db';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type { User, Session, Report, AdminConfig } from '../types';

type Tab = 'overview' | 'approvals' | 'users' | 'sessions' | 'safety' | 'settings';

export default function AdminDashboard() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>((urlTab as Tab) || 'overview');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [reviewingReport, setReviewingReport] = useState<Report | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [config, setConfig] = useState<AdminConfig>({ autoApproval: false, maintenanceMode: false });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newAlumni, setNewAlumni] = useState({
    fullName: '',
    email: '',
    password: '',
    graduationYear: '',
    expertise: '',
    department: 'Computer Science',
    faculty: 'Science',
  });

  // ─── Load all data on mount ──────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    const [u, s, r, c] = await Promise.all([
      getUsers(),
      getSessions(),
      getReports(),
      getAdminConfig(),
    ]);
    setUsers(u);
    setSessions(s);
    setReports(r);
    setConfig(c);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab as Tab);
  }, [urlTab]);

  // ─── Auto-dismiss notification ────────────────────────────────────────────────
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    navigate(`/dashboard/admin/${tabId === 'overview' ? '' : tabId}`);
  };

  const showNotif = (message: string, type: 'success' | 'error' = 'success') =>
    setNotification({ message, type });

  // ─── Approvals ───────────────────────────────────────────────────────────────
  const handleApprove = async (userId: string) => {
    await updateUserStatus(userId, 'active');
    showNotif('Alumnus approved successfully');
    loadAll();
  };

  const handleReject = async (userId: string) => {
    await updateUserStatus(userId, 'rejected');
    showNotif('Alumnus application rejected');
    loadAll();
  };

  // ─── User management ─────────────────────────────────────────────────────────
  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateProfile(editingUser.id, {
      fullName: editingUser.fullName,
      department: editingUser.department,
      status: editingUser.status,
    });
    setEditingUser(null);
    showNotif('User updated successfully');
    loadAll();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteUser(userId);
    showNotif('User deleted successfully');
    loadAll();
  };

  // Add alumni manually via Supabase Auth signUp (status = active, bypasses pending)
  const handleAddAlumni = async (e: FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    const { error } = await signUp(newAlumni.email, newAlumni.password, {
      full_name: newAlumni.fullName,
      role: 'alumni',
      status: 'active',
      department: newAlumni.department,
      faculty: newAlumni.faculty,
      graduation_year: newAlumni.graduationYear,
      expertise: newAlumni.expertise,
    });
    setAddLoading(false);
    if (error) { showNotif(error.message, 'error'); return; }
    setShowAddUserModal(false);
    setNewAlumni({ fullName: '', email: '', password: '', graduationYear: '', expertise: '', department: 'Computer Science', faculty: 'Science' });
    showNotif('Alumni account created successfully');
    loadAll();
  };

  // ─── Safety / Reports ────────────────────────────────────────────────────────
  const handleDismissReport = async (reportId: string) => {
    // Mark dismissed in UI immediately (no separate DB status for now)
    setReports(prev => prev.filter(r => r.id !== reportId));
    showNotif('Report dismissed successfully');
  };

  // ─── Sessions CSV export ─────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Session ID', 'Mentor', 'Mentee', 'Date', 'Status', 'Duration'];
    const rows = sessions.map(s => [s.id, s.mentor, s.mentee, s.date, s.status, s.duration]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fud_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotif('Session logs exported to CSV');
  };

  // ─── Admin Config ────────────────────────────────────────────────────────────
  const toggleConfig = async (key: keyof AdminConfig) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    await saveAdminConfig(updated);
    showNotif('System configuration updated');
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // ─── Derived state ────────────────────────────────────────────────────────────
  const pendingAlumni = users.filter(u => u.role === 'alumni' && u.status === 'pending');
  const students = users.filter(u => u.role === 'student');
  const alumni = users.filter(u => u.role === 'alumni');
  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateChartData = (allUsers: User[]) => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(23, 59, 59, 999);
      
      const count = allUsers.filter(u => {
        if (!u.createdAt) return true; // count legacy users without createdAt as always existing
        const cd = new Date(u.createdAt);
        return cd <= d;
      }).length;

      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        users: count,
      });
    }
    return data;
  };

  const chartData = generateChartData(users);

  // Dynamic trend calculations
  const newUsersThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const newSessionsThisWeek = sessions.filter(s => new Date(s.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar role="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Admin Control Center</h1>
            <p className="mt-1 text-slate-500">System-wide management and moderation.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <Shield size={20} className="text-indigo-900" />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-900 transition-transform hover:scale-105 active:scale-95"
              >
                <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200"
                    >
                      <div className="px-3 py-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrator</p>
                        <p className="text-sm font-bold text-slate-900">Admin User</p>
                      </div>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={() => handleTabChange('settings')}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-900"
                      >
                        <Settings size={16} /> Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-px">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
            { id: 'approvals', label: 'Alumni Approvals', icon: <Users size={16} />, count: pendingAlumni.length },
            { id: 'users', label: 'User Management', icon: <Users size={16} /> },
            { id: 'sessions', label: 'Session Logs', icon: <FileText size={16} /> },
            { id: 'safety', label: 'Trust & Safety', icon: <AlertTriangle size={16} /> },
            { id: 'settings', label: 'Admin Settings', icon: <Settings size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as Tab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-900 text-indigo-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-indigo-900" />
          </div>
        )}

        {/* Content Area */}
        {!loading && (
          <div className="space-y-6">
            {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Total Users', value: users.length, icon: <Users size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `+${newUsersThisWeek} this week`, up: newUsersThisWeek >= 0 },
                    { label: 'Pending Approvals', value: pendingAlumni.length, icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Needs Action', up: false },
                    { label: 'Total Sessions', value: sessions.length, icon: <Activity size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `+${newSessionsThisWeek} this week`, up: newSessionsThisWeek >= 0 },
                    { label: 'Reported Issues', value: reports.length, icon: <AlertTriangle size={20} />, color: 'text-red-600', bg: 'bg-red-50', trend: reports.length > 0 ? 'Requires attention' : 'All clear', up: reports.length === 0 },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                          {stat.icon}
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {stat.trend}
                        </div>
                      </div>
                      <p className="mt-4 text-2xl font-extrabold text-slate-900">{stat.value}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h2 className="mb-6 text-lg font-bold text-slate-900">User Growth</h2>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#312e81" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#312e81" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="users" stroke="#312e81" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h2 className="mb-6 text-lg font-bold text-slate-900">User Distribution</h2>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Students', count: students.length },
                          { name: 'Alumni', count: alumni.length },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="count" fill="#312e81" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 rounded-2xl bg-indigo-50 p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-indigo-600" size={20} />
                        <p className="text-sm font-bold text-indigo-900">Platform Insight</p>
                      </div>
                      <p className="mt-2 text-xs text-indigo-700 leading-relaxed">
                        {alumni.length} alumni mentors serving {students.length} students on the platform.
                      </p>
                    </div>
                  </section>
                </div>
              </>
            )}

            {/* ── APPROVALS ───────────────────────────────────────────────────── */}
            {activeTab === 'approvals' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-6 text-lg font-bold text-slate-900">Pending Alumni Verifications</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-4 pl-2">Alumnus</th>
                        <th className="pb-4">Faculty/Dept</th>
                        <th className="pb-4">Expertise</th>
                        <th className="pb-4">Grad Year</th>
                        <th className="pb-4 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pendingAlumni.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <CheckCircle size={32} className="text-emerald-400" />
                              <p className="font-medium">No pending approvals</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pendingAlumni.map((alumnus) => (
                          <tr key={alumnus.id} className="group hover:bg-slate-50/50">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
                                  <img src={`https://picsum.photos/seed/${alumnus.id}/100/100`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{alumnus.fullName}</p>
                                  <p className="text-xs text-slate-500">{alumnus.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <p className="text-sm text-slate-700">{alumnus.faculty}</p>
                              <p className="text-xs text-slate-500">{alumnus.department}</p>
                            </td>
                            <td className="py-4">
                              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">
                                {alumnus.expertise || '—'}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-slate-600">{alumnus.graduationYear || '—'}</td>
                            <td className="py-4 text-right pr-2">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(alumnus.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleReject(alumnus.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── USER MANAGEMENT ─────────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:border-indigo-900 focus:ring-indigo-900"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800"
                    >
                      <UserPlus size={16} /> Add Alumni
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-4 pl-2">User</th>
                        <th className="pb-4">Role</th>
                        <th className="pb-4">Department</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-slate-50/50">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
                                <img src={`https://picsum.photos/seed/${u.id}/100/100`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{u.fullName}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'student' ? 'bg-blue-50 text-blue-600' :
                              u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{u.department || '—'}</td>
                          <td className="py-4">
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                              u.status === 'active' ? 'text-emerald-600' :
                              u.status === 'pending' ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                u.status === 'active' ? 'bg-emerald-600' :
                                u.status === 'pending' ? 'bg-amber-600' :
                                'bg-red-600'
                              }`} />
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setViewingUser(u)}
                                className="p-2 text-slate-400 hover:text-emerald-600"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-2 text-slate-400 hover:text-indigo-900"
                                title="Edit"
                              >
                                <MoreVertical size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-2 text-slate-400 hover:text-red-600"
                                title="Delete"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No users match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── SESSION LOGS ─────────────────────────────────────────────────── */}
            {activeTab === 'sessions' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Mentorship Session Logs</h2>
                    <p className="text-sm text-slate-500">Monitoring platform activity and engagement.</p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <FileText size={16} /> Export CSV
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No session logs yet. Sessions will appear here once mentors and students connect.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-4 pl-2">Session ID</th>
                          <th className="pb-4">Mentor</th>
                          <th className="pb-4">Mentee</th>
                          <th className="pb-4">Date & Time</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4 text-right pr-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-50/50">
                            <td className="py-4 pl-2 text-sm font-mono text-slate-500">{session.id.slice(0, 8)}…</td>
                            <td className="py-4 text-sm font-bold text-slate-900">{session.mentor}</td>
                            <td className="py-4 text-sm text-slate-700">{session.mentee}</td>
                            <td className="py-4 text-sm text-slate-500">{session.date}</td>
                            <td className="py-4">
                              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                session.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {session.status}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-2 text-sm text-slate-500">{session.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ── TRUST & SAFETY ───────────────────────────────────────────────── */}
            {activeTab === 'safety' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Trust & Safety Hub</h2>
                  <p className="text-sm text-slate-500">Moderation and reported issues.</p>
                </div>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle size={24} />
                      </div>
                      <p className="text-slate-500">All clear! No pending safety reports.</p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="rounded-2xl border border-slate-100 p-4 transition-all hover:border-red-100 hover:bg-red-50/30">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                              <AlertTriangle size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900">Report #{report.id.slice(0, 8)}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  report.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {report.severity} Severity
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-600">
                                <span className="font-bold text-slate-900">{report.reporter}</span> reported <span className="font-bold text-slate-900">{report.reported}</span>
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-700">"{report.reason}"</p>
                              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{report.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setReviewingReport(report)}
                              className="rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleDismissReport(report.id)}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* ── ADMIN SETTINGS ───────────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-6 text-lg font-bold text-slate-900">Admin Settings</h2>
                <div className="max-w-2xl space-y-8">
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Lock size={16} /> Add New Administrator
                    </h3>
                    <p className="mb-4 text-xs text-slate-500">Use the "Add Alumni" button in User Management to invite users. Direct admin creation is managed via the Supabase dashboard for security.</p>
                    <button
                      onClick={() => showNotif('Use the Supabase Dashboard to create admin users for security.', 'error')}
                      className="rounded-xl bg-slate-100 px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
                    >
                      Learn More
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-8">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">System Configuration</h3>
                    <div className="space-y-4">
                      {[
                        {
                          key: 'autoApproval' as keyof AdminConfig,
                          label: 'Automatic Alumni Approval',
                          desc: 'Bypass manual review for verified email domains.',
                        },
                        {
                          key: 'maintenanceMode' as keyof AdminConfig,
                          label: 'Maintenance Mode',
                          desc: 'Restrict platform access for system updates.',
                        },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{label}</p>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                          <button
                            onClick={() => toggleConfig(key)}
                            className={`h-6 w-11 rounded-full p-1 transition-all ${config[key] ? 'bg-indigo-900' : 'bg-slate-200'}`}
                          >
                            <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all ${config[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ── NOTIFICATION TOAST ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl ${
              notification.type === 'success' ? 'bg-indigo-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <p className="text-sm font-bold">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REVIEW REPORT MODAL ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {reviewingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingReport(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold">Review Safety Report</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Details</p>
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{reviewingReport.reporter}</span> reported{' '}
                    <span className="font-bold text-slate-900">{reviewingReport.reported}</span>
                  </p>
                  <p className="mt-2 text-sm italic text-slate-600">"{reviewingReport.reason}"</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900">Administrative Actions</p>
                  <button
                    onClick={() => {
                      showNotif(`Warning sent to ${reviewingReport.reported}`);
                      handleDismissReport(reviewingReport.id);
                      setReviewingReport(null);
                    }}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"
                  >
                    Send Formal Warning
                  </button>
                  <button
                    onClick={() => {
                      showNotif(`${reviewingReport.reported} has been suspended`);
                      handleDismissReport(reviewingReport.id);
                      setReviewingReport(null);
                    }}
                    className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    Suspend User Account
                  </button>
                </div>
              </div>
              <div className="mt-8">
                <button
                  onClick={() => setReviewingReport(null)}
                  className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  Close Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW USER MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingUser(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-indigo-50">
                  <img src={`https://picsum.photos/seed/${viewingUser.id}/150/150`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{viewingUser.fullName}</h2>
                  <p className="text-sm font-medium text-slate-500">{viewingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                  <p className="mt-1 font-bold capitalize text-slate-900">{viewingUser.role}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Status</p>
                  <p className={`mt-1 font-bold capitalize ${
                    viewingUser.status === 'active' ? 'text-emerald-600' :
                    viewingUser.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                  }`}>{viewingUser.status}</p>
                </div>
                
                <div className="col-span-2 mt-2 h-px bg-slate-200" />
                
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Info</p>
                  <p className="mt-1 text-sm text-slate-900">
                    <span className="font-semibold">{viewingUser.faculty || '—'}</span> &bull; {viewingUser.department || '—'}
                  </p>
                </div>

                {viewingUser.role === 'student' && (
                  <>
                    <div className="col-span-2">
                       <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level</p>
                       <p className="mt-1 text-sm text-slate-900">{viewingUser.level || '—'}</p>
                    </div>
                    {viewingUser.interests && viewingUser.interests.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Interests</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {viewingUser.interests.map(i => (
                            <span key={i} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{i}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {viewingUser.role === 'alumni' && (
                  <>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Graduation Year</p>
                       <p className="mt-1 text-sm text-slate-900">{viewingUser.graduationYear || '—'}</p>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expertise / Industry</p>
                       <p className="mt-1 text-sm text-slate-900">{viewingUser.expertise || '—'}</p>
                    </div>
                    {viewingUser.bio && (
                      <div className="col-span-2">
                         <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bio</p>
                         <p className="mt-1 text-sm text-slate-700">{viewingUser.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mt-8">
                <button
                  onClick={() => setViewingUser(null)}
                  className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 shadow-lg"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT USER MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-900">Edit User Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Update user details and permissions.</p>
              <form className="mt-6 space-y-4" onSubmit={handleUpdateUser}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingUser.fullName}
                      onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Status</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Department</label>
                    <input
                      type="text"
                      value={editingUser.department ?? ''}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-900 py-3 text-sm font-bold text-white hover:bg-indigo-800 shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD ALUMNI MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-900">Manually Add Alumni</h2>
              <p className="mt-1 text-sm text-slate-500">Create an account with immediate active status.</p>
              <form className="mt-6 space-y-4" onSubmit={handleAddAlumni}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAlumni.fullName}
                      onChange={(e) => setNewAlumni({ ...newAlumni, fullName: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      value={newAlumni.email}
                      onChange={(e) => setNewAlumni({ ...newAlumni, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Temporary Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newAlumni.password}
                      onChange={(e) => setNewAlumni({ ...newAlumni, password: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Graduation Year</label>
                    <input
                      type="text"
                      value={newAlumni.graduationYear}
                      onChange={(e) => setNewAlumni({ ...newAlumni, graduationYear: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                      placeholder="e.g. 2018"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Department</label>
                    <input
                      type="text"
                      value={newAlumni.department}
                      onChange={(e) => setNewAlumni({ ...newAlumni, department: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Expertise</label>
                    <input
                      type="text"
                      value={newAlumni.expertise}
                      onChange={(e) => setNewAlumni({ ...newAlumni, expertise: e.target.value })}
                      className="mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                      placeholder="e.g. Software Engineering"
                    />
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-900 py-3 text-sm font-bold text-white hover:bg-indigo-800 shadow-lg disabled:opacity-60"
                  >
                    {addLoading && <Loader2 size={16} className="animate-spin" />}
                    {addLoading ? 'Creating…' : 'Create Alumnus'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
