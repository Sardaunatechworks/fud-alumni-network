import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import BookingModal from '../components/BookingModal';
import { motion } from 'motion/react';
import {
  Users,
  MessageSquare,
  Star,
  ArrowRight,
  Search,
  Clock,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { getMentorshipRequestsForStudent, getChatsForUser } from '../lib/db';
import { useAuth } from '../lib/authContext';
import type { MentorshipRequest, Chat } from '../types';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { profile: user } = useAuth();
  const [acceptedMentors, setAcceptedMentors] = useState<MentorshipRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MentorshipRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const myRequests = await getMentorshipRequestsForStudent(user.id);
      setAcceptedMentors(myRequests.filter(r => r.status === 'accepted'));
      setPendingRequests(myRequests.filter(r => r.status === 'pending'));
      setTotalRequests(myRequests.length);
      const allChats = await getChatsForUser(user.id);
      setRecentChats(
        allChats
          .filter(c => c.lastMessage)
          .slice(0, 5)
      );

      // Calculate profile completion dynamically
      const fields = ['fullName', 'email', 'role', 'department', 'faculty', 'level', 'bio'];
      let completedFields = 0;
      fields.forEach(field => {
        if ((user as any)[field] && String((user as any)[field]).trim() !== '') {
          completedFields++;
        }
      });
      // Add interests array to check
      if (user.interests && user.interests.length > 0) completedFields++;
      
      const totalFields = fields.length + 1; // +1 for interests
      setProfileCompletion(Math.round((completedFields / totalFields) * 100));
    };
    load();
  }, [user]);

  const handleBookSession = (mentorName: string) => {
    setSelectedMentorForBooking(mentorName);
    setIsBookingModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface lg:pl-64">
      <Sidebar role="student" />
      
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Welcome, {user.fullName}! 👋</h1>
            <p className="mt-1 text-slate-500">Here's what's happening with your mentorship journey.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/student/mentors" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-primary/30">
              <Search size={20} className="text-slate-500" />
            </Link>
            <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary">
              <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Connected Mentors', value: acceptedMentors.length, icon: <UserCheck size={20} />, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Pending Requests', value: pendingRequests.length, icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Active Messages', value: recentChats.length, icon: <MessageSquare size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Requests', value: totalRequests, icon: <Star size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
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
            {/* Connected Mentors & Booking */}
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Your Connected Mentors</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {acceptedMentors.length} Mentor{acceptedMentors.length !== 1 ? 's' : ''}
                </span>
              </div>
              {acceptedMentors.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Users size={40} className="text-slate-200" />
                  <p className="mt-3 text-sm font-bold text-slate-500">No mentors yet</p>
                  <p className="text-xs text-slate-400">Send a connection request to get started.</p>
                  <Link
                    to="/dashboard/student/mentors"
                    className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition-all hover:bg-primary-dark"
                  >
                    Find Mentors
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedMentors.map((req, i) => (
                    <div key={i} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 transition-all hover:bg-slate-50 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <img src={req.alumniAvatarUrl || `https://picsum.photos/seed/${req.alumniId}/100/100`} alt={req.alumniName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.alumniName}</p>
                          <p className="text-xs text-slate-500">Mentor</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/dashboard/student/chat?chat=${user?.id}_${req.alumniId}`}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 text-center transition-all hover:bg-slate-100 sm:flex-none"
                        >
                          Message
                        </Link>
                        <button
                          onClick={() => handleBookSession(req.alumniName)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primary-dark sm:flex-none"
                        >
                          <Calendar size={14} /> Book Session
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Pending Requests</h2>
                <div className="space-y-3">
                  {pendingRequests.map((req, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl bg-amber-50 p-4">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
                        <img src={req.alumniAvatarUrl || `https://picsum.photos/seed/${req.alumniId}/100/100`} alt={req.alumniName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{req.alumniName}</p>
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Awaiting Response</p>
                      </div>
                      <Clock size={16} className="text-amber-500" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Chats */}
            {recentChats.length > 0 && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Recent Messages</h2>
                  <Link to="/dashboard/student/chat" className="text-sm font-bold text-primary hover:underline">View All</Link>
                </div>
                <div className="space-y-3">
                  {recentChats.map((chat, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-50 p-3 transition-all hover:bg-slate-50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <MessageSquare size={16} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{chat.alumniName}</p>
                        <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unreadByStudent > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {chat.unreadByStudent}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <section className="rounded-3xl bg-primary p-6 text-white shadow-lg">
              <h2 className="text-lg font-bold">Your Profile</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20">
                  <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-sm font-bold">{user.fullName}</p>
                  <p className="text-[10px] text-primary-light">{user.department}</p>
                </div>
              </div>
              {user.interests && user.interests.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest: string) => (
                      <span key={interest} className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white ring-1 ring-white/20">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Link
                to="/dashboard/student/settings"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-primary transition-all hover:bg-primary/5"
              >
                Edit Profile <ArrowRight size={16} />
              </Link>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Your Progress</h2>
              <p className="mt-1 text-sm text-slate-500">Keep up the good work!</p>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Profile Completion</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${profileCompletion}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{acceptedMentors.length}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Mentors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalRequests}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Requests</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/dashboard/student/mentors" className="flex items-center gap-3 rounded-2xl p-3 text-sm font-medium text-slate-700 transition-all hover:bg-primary/5 hover:text-primary">
                  <Search size={18} className="text-primary" /> Find a Mentor
                </Link>
                <Link to="/dashboard/student/chat" className="flex items-center gap-3 rounded-2xl p-3 text-sm font-medium text-slate-700 transition-all hover:bg-primary/5 hover:text-primary">
                  <MessageSquare size={18} className="text-primary" /> Open Messages
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        mentorName={selectedMentorForBooking || ''}
      />
    </div>
  );
}
