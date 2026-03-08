import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
  Bell, 
  MessageSquare, 
  Star, 
  Calendar, 
  Trash2, 
  CheckCircle, 
  Filter, 
  Search,
  MoreVertical,
  Clock,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/authContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/db';
import type { AppNotification } from '../../types';
import { UserPlus, Info } from 'lucide-react';

const CATEGORY_STYLES: Record<AppNotification['category'], { bg: string; icon: React.ReactNode }> = {
  request: { bg: 'bg-indigo-50', icon: <UserPlus size={18} className="text-indigo-600" /> },
  message: { bg: 'bg-emerald-50', icon: <MessageSquare size={18} className="text-emerald-600" /> },
  session: { bg: 'bg-amber-50', icon: <Calendar size={18} className="text-amber-600" /> },
  system: { bg: 'bg-slate-50', icon: <Info size={18} className="text-slate-600" /> },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Notifications() {
  const { profile: user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = async (uid: string) => {
    const data = await getNotifications(uid);
    setNotifications(data);
  };

  useEffect(() => {
    if (user) refresh(user.id);
  }, [user]);

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    refresh(user.id);
  };

  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id);
    if (user) refresh(user.id);
  };

  const filters = [
    { id: 'all', name: 'All' },
    { id: 'message', name: 'Messages' },
    { id: 'session', name: 'Sessions' },
    { id: 'system', name: 'System' },
    { id: 'request', name: 'Requests' },
  ];

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = activeFilter === 'all' || n.category === activeFilter;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group by date
  const groupedNotifications = filteredNotifications.reduce((acc, n) => {
    const header = formatDateHeader(n.date);
    if (!acc[header]) acc[header] = [];
    acc[header].push(n);
    return acc;
  }, {} as Record<string, AppNotification[]>);

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar role="student" />
      
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
        <header className="mb-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-widest mb-2">
                <Bell size={14} />
                Activity Center
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Notifications</h1>
              <p className="mt-2 text-slate-500">Stay updated with your mentorship activities and network updates.</p>
            </div>
            <div className="flex items-center gap-3">
              {notifications.some(n => !n.read) && (
                <button 
                  onClick={handleMarkAll}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                >
                  <Check size={16} /> Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all
                    ${activeFilter === filter.id 
                      ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-900/20' 
                      : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}
                  `}
                >
                  {filter.name}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-white py-2.5 pr-4 pl-11 text-sm focus:border-indigo-900 focus:ring-indigo-900"
              />
            </div>
          </div>
        </header>

        <div className="space-y-10">
          {(Object.entries(groupedNotifications) as [string, AppNotification[]][]).map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</h2>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                  {items.map((notif) => {
                    const style = CATEGORY_STYLES[notif.category] || CATEGORY_STYLES.system;
                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => !notif.read && handleMarkOne(notif.id)}
                        className={`
                          cursor-pointer group relative flex items-start gap-5 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-100
                          ${!notif.read ? 'bg-gradient-to-r from-white to-indigo-50/30' : ''}
                        `}
                      >
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner ${style.bg}`}>
                          {style.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-base font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                {notif.title}
                              </h3>
                              {!notif.read && (
                                <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.6)]"></span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                              <Clock size={12} />
                              {timeAgo(notif.date)}
                            </div>
                          </div>
                          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed max-w-2xl">
                            {notif.body}
                          </p>
                          <div className="mt-5 flex items-center gap-4">
                            <button className="rounded-xl bg-indigo-900 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-900/10 transition-all hover:bg-indigo-800">
                              View Details
                            </button>
                            <button className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
                              Dismiss
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          {notif.read && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-500 transition-all">
                              <CheckCircle size={16} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-75"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-400">
                <Bell size={48} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No notifications found</h3>
            <p className="mt-2 text-slate-500 max-w-xs">
              {searchQuery ? `We couldn't find any notifications matching "${searchQuery}"` : "You're all caught up! Check back later for new updates."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 text-sm font-bold text-indigo-900 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
