import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { motion } from 'motion/react';
import {
  Users,
  MessageSquare,
  Star,
  ArrowRight,
  TrendingUp,
  Clock,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { getMentorshipRequestsForAlumni, updateRequestStatus, addNotification } from '../lib/db';
import { useAuth } from '../lib/authContext';
import type { MentorshipRequest } from '../types';
import { Link } from 'react-router-dom';

export default function AlumniDashboard() {
  const { profile: user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<MentorshipRequest[]>([]);
  const [acceptedMentees, setAcceptedMentees] = useState<MentorshipRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);

  const refresh = async (userId: string) => {
    const all = await getMentorshipRequestsForAlumni(userId);
    setPendingRequests(all.filter(r => r.status === 'pending'));
    setAcceptedMentees(all.filter(r => r.status === 'accepted'));
    setTotalRequests(all.length);

    if (user) {
      const fields = ['fullName', 'email', 'role', 'department', 'faculty', 'expertise', 'bio'];
      let completedFields = 0;
      fields.forEach(field => {
        if ((user as any)[field] && String((user as any)[field]).trim() !== '') {
          completedFields++;
        }
      });
      const totalFields = fields.length;
      setProfileCompletion(Math.round((completedFields / totalFields) * 100));
    }
  };

  useEffect(() => {
    if (user) refresh(user.id);
  }, [user]);

  const handleAccept = async (req: MentorshipRequest) => {
    await updateRequestStatus(req.id, 'accepted');
    await addNotification({
      userId: req.studentId,
      category: 'request',
      title: 'Mentorship Request Accepted!',
      body: `${req.alumniName} has accepted your mentorship request.`,
      read: false,
      relatedId: req.id,
    });
    if (user) refresh(user.id);
  };

  const handleDecline = async (req: MentorshipRequest) => {
    await updateRequestStatus(req.id, 'declined');
    await addNotification({
      userId: req.studentId,
      category: 'request',
      title: 'Mentorship Request Declined',
      body: `${req.alumniName} is currently unable to take on new mentees.`,
      read: false,
      relatedId: req.id,
    });
    if (user) refresh(user.id);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar role="alumni" />
      
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Welcome back, {user.fullName}! 🎓</h1>
            <p className="mt-1 text-slate-500">Your mentorship is shaping the future of FUD students.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-900">
              <img src="https://picsum.photos/seed/alumni/100/100" alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Statistics Section */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active Mentees', value: acceptedMentees.length, icon: <Users size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Pending Requests', value: pendingRequests.length, icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Requests', value: totalRequests, icon: <Calendar size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Profile Score', value: `${profileCompletion}%`, icon: <Star size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="space-y-6 lg:col-span-2">
            {/* Active Mentees Section */}
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Active Mentees</h2>
                <Link to="/dashboard/alumni/mentees" className="text-sm font-bold text-indigo-900 hover:underline">Manage All</Link>
              </div>
              {acceptedMentees.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Users size={40} className="text-slate-200" />
                  <p className="mt-3 text-sm font-bold text-slate-500">No active mentees yet</p>
                  <p className="text-xs text-slate-400">Accept incoming requests to start mentoring.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedMentees.map((mentee, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-50 p-4 transition-all hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                          <img src={`https://picsum.photos/seed/${mentee.studentId}/100/100`} alt={mentee.studentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{mentee.studentName}</p>
                          <p className="text-xs text-slate-500">{mentee.studentDept} • {mentee.studentLevel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/dashboard/alumni/chat"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-900 hover:bg-indigo-900 hover:text-white transition-all"
                        >
                          <MessageSquare size={18} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">New Mentorship Requests</h2>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingRequests.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {pendingRequests.map((req, i) => (
                    <div key={i} className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-200">
                            <img src={`https://picsum.photos/seed/${req.studentId}/100/100`} alt={req.studentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{req.studentName}</p>
                            <p className="text-[10px] text-slate-500">{req.studentDept} • {req.studentLevel}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(req)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                            title="Accept"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleDecline(req)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Decline"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                      {req.reason && (
                        <p className="mt-3 text-xs italic text-slate-600 border-t border-slate-100 pt-3">
                          "{req.reason}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <section className="rounded-3xl bg-indigo-900 p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Award size={24} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-bold">Your Profile</h2>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20">
                  <img src="https://picsum.photos/seed/alumni/100/100" alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-sm font-bold">{user.fullName}</p>
                  <p className="text-[10px] text-indigo-300">{user.department}</p>
                </div>
              </div>
              {user.expertise && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {(user.expertise.includes(',') ? user.expertise.split(',') : [user.expertise]).map((exp, i) => (
                      <span key={i} className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white ring-1 ring-white/20">
                        {exp.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Link
                to="/dashboard/alumni/settings"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-indigo-900 transition-all hover:bg-indigo-50"
              >
                Edit Profile <ArrowRight size={16} />
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
