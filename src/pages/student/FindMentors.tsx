import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import BookingModal from '../../components/BookingModal';
import { Search, Filter, Star, MapPin, Briefcase, GraduationCap, CheckCircle, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMentorshipRequestsForStudent, addMentorshipRequest, addNotification, getAlumni } from '../../lib/db';
import { useAuth } from '../../lib/authContext';
import type { MentorshipRequest, User } from '../../types';

type RequestState = 'none' | 'pending' | 'accepted' | 'declined';

export default function FindMentors() {
  const { profile: user } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSkill, setSelectedSkill] = useState('All Skills');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [requestStates, setRequestStates] = useState<Record<number, RequestState>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [existingRequests, alumniData] = await Promise.all([
        getMentorshipRequestsForStudent(user.id),
        getAlumni()
      ]);
      
      setMentors(alumniData);

      const states: Record<string, RequestState> = {};
      for (const mentor of alumniData) {
        const req = existingRequests.find(r => r.alumniId === mentor.id);
        if (req) states[mentor.id] = req.status as RequestState;
      }
      setRequestStates(states);
      setLoading(false);
    };
    load();
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleConnect = async (mentor: User) => {
    if (!user) return;
    const currentState = requestStates[mentor.id];
    if (currentState === 'pending' || currentState === 'accepted') return;

    setConnectingId(mentor.id);
    await new Promise(r => setTimeout(r, 500));

    const alumniId = mentor.id;
    const result = await addMentorshipRequest(
      user.id,
      alumniId,
      'I would love to learn from your experience.'
    );

    if (result) {
      // Notify the alumni
      await addNotification({
        userId: alumniId,
        category: 'request',
        title: 'New Mentorship Request',
        body: `${user.fullName} (${user.department}) has sent you a mentorship request.`,
        read: false,
        relatedId: result.id,
      });
      setRequestStates(prev => ({ ...prev, [mentor.id]: 'pending' }));
    }
    setConnectingId(null);
    showToast(`Request sent to ${mentor.fullName}!`);
  };

  const handleBookSession = (mentorName: string) => {
    setSelectedMentorForBooking(mentorName);
    setIsBookingModalOpen(true);
  };

  // Helper to safely get expertise as an array
  const getExpertiseArray = (mentor: User): string[] => {
    if (!mentor.expertise) return [];
    if (Array.isArray(mentor.expertise)) return mentor.expertise as string[];
    return String(mentor.expertise).split(',').map(s => s.trim()).filter(Boolean);
  };

  const filteredMentors = mentors.filter(mentor => {
    const expertiseArray = getExpertiseArray(mentor);
    const matchesSearch = mentor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (mentor.expertise || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All Departments' || mentor.department === selectedDept;
    
    // We'll treat expertise as skills for filtering purposes
    const matchesSkill = selectedSkill === 'All Skills' || expertiseArray.includes(selectedSkill);
    const matchesAvailability = !showOnlyAvailable || true; // true because we lack a dedicated availability DB column yet
    return matchesSearch && matchesDept && matchesSkill && matchesAvailability;
  });

  const allSkills = ['All Skills', ...new Set(mentors.flatMap(m => getExpertiseArray(m)))];
  const departments = ['All Departments', ...new Set(mentors.map(m => m.department).filter(Boolean))];

  const getConnectButton = (mentor: User) => {
    const state = requestStates[mentor.id];
    if (state === 'accepted') {
      return (
        <button disabled className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white">
          <CheckCircle size={16} /> Connected
        </button>
      );
    }
    if (state === 'pending') {
      return (
        <button disabled className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-amber-100 py-3 text-sm font-bold text-amber-700">
          <Clock size={16} /> Pending
        </button>
      );
    }
    return (
      <button
        onClick={() => handleConnect(mentor)}
        disabled={connectingId === mentor.id}
        className="flex-[1.5] rounded-xl bg-indigo-900 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-800 hover:shadow-lg disabled:opacity-60"
      >
        {connectingId === mentor.id ? 'Sending...' : 'Connect'}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar role="student" />
      
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Find Your Mentor</h1>
          <p className="mt-1 text-slate-500">Connect with successful FUD alumni across the globe.</p>
        </header>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, role, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-slate-200 bg-white py-4 pr-4 pl-12 text-slate-900 shadow-sm transition-all focus:border-indigo-900 focus:ring-indigo-900"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Filter className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="appearance-none rounded-2xl border-slate-200 bg-white py-4 pr-10 pl-12 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-900 focus:ring-indigo-900"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Briefcase className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="appearance-none rounded-2xl border-slate-200 bg-white py-4 pr-10 pl-12 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-900 focus:ring-indigo-900"
                >
                  {allSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="relative inline-flex cursor-pointer items-center">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={showOnlyAvailable}
                onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"></div>
              <span className="ml-3 text-sm font-medium text-slate-700">Show only available mentors</span>
            </label>
          </div>
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-900 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-slate-500">Loading mentors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMentors.map((mentor) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="group relative flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-4 ring-slate-50">
                  <img
                    src={`https://picsum.photos/seed/${mentor.id}/200/200`}
                    alt={mentor.fullName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h3 className="line-clamp-1 text-lg font-bold text-slate-900" title={mentor.fullName}>{mentor.fullName}</h3>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">5.0</span>
                    </div>
                  </div>
                  <p className="line-clamp-1 text-sm font-medium text-indigo-900" title={mentor.expertise || 'Alumnus'}>
                    {mentor.expertise || 'Alumnus'}
                  </p>
                  <p className="text-xs text-slate-500">at FUD Network</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      Available
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mentorship Approach</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2 italic">
                  "{mentor.bio || "I am passionate about guiding students through their career journey and sharing my industry experience."}"
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <GraduationCap size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate" title={mentor.department}>{mentor.department || 'Any Department'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate">Global</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {getExpertiseArray(mentor).slice(0, 3).map(skill => (
                  <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => handleBookSession(mentor.fullName)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Book Session
                </button>
                {getConnectButton(mentor)}
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {!loading && filteredMentors.length === 0 && (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No mentors found</h3>
            <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 rounded-2xl bg-indigo-900 px-6 py-4 text-white shadow-2xl"
          >
            <CheckCircle size={20} />
            <p className="text-sm font-bold">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        mentorName={selectedMentorForBooking || ''}
      />
    </div>
  );
}
