import Sidebar from '../../components/Sidebar';
import { motion } from 'motion/react';
import { Search, Filter, MessageSquare, UserCheck, UserX, MoreVertical, GraduationCap, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { getMentorshipRequestsForAlumni, updateRequestStatus, addNotification } from '../../lib/db';
import type { MentorshipRequest } from '../../types';

export default function Mentees() {
  const { profile: user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mentees, setMentees] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentees = async () => {
    if (!user) return;
    setLoading(true);
    const requests = await getMentorshipRequestsForAlumni(user.id);
    // Only show pending and accepted mentees
    setMentees(requests.filter(r => r.status !== 'declined'));
    setLoading(false);
  };

  useEffect(() => {
    fetchMentees();
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
    fetchMentees();
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
    fetchMentees();
  };

  const filteredMentees = mentees.filter(m => 
    m.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.studentDept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar role="alumni" />
      
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">My Mentees</h1>
          <p className="mt-1 text-slate-500">Manage and guide your assigned students.</p>
        </header>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search mentees by name or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-slate-200 bg-white py-4 pr-4 pl-12 text-slate-900 shadow-sm transition-all focus:border-indigo-900 focus:ring-indigo-900"
            />
          </div>
          <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Mentees List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-900 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-slate-500">Loading mentees...</p>
          </div>
        ) : filteredMentees.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserX size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No mentees found</h3>
            <p className="mt-2 text-sm text-slate-500">
              You do not have any mentees or requests matching this criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredMentees.map((mentee) => (
              <motion.div
                key={mentee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl ring-4 ring-slate-50">
                      <img src={`https://picsum.photos/seed/${mentee.studentId}/100/100`} alt={mentee.studentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{mentee.studentName}</h3>
                      <p className="text-xs text-slate-500">{mentee.studentDept}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        mentee.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {mentee.status}
                      </span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-indigo-900">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <GraduationCap size={14} className="text-slate-400" />
                    <span>{mentee.studentLevel || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Date: {new Date(mentee.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  {mentee.status === 'pending' ? (
                    <>
                      <button onClick={() => handleAccept(mentee)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-900 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-800">
                        <UserCheck size={16} /> Accept
                      </button>
                      <button onClick={() => handleDecline(mentee)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 hover:bg-red-50">
                        <UserX size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-900 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-800">
                        <MessageSquare size={16} /> Chat
                      </button>
                      <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        View Progress
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
