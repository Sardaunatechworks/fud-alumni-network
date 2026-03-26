import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, CheckCircle, UserPlus, MessageSquare, Calendar, CheckCheck, Info
} from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../lib/db';
import { useAuth } from '../../lib/authContext';
import type { AppNotification } from '../../types';

const CATEGORY_STYLES: Record<AppNotification['category'], { bg: string; icon: React.ReactNode }> = {
  request: { bg: 'bg-primary/5', icon: <UserPlus size={18} className="text-primary" /> },
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

export default function AlumniNotifications() {
  const { profile: user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface lg:pl-64">
      <Sidebar role="alumni" />

      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
                : 'You are all caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </header>

        <div className="space-y-3">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-3xl bg-white py-24 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Bell size={32} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">No notifications yet</h3>
                <p className="mt-1 text-sm text-slate-500">We'll let you know when something happens.</p>
              </motion.div>
            ) : (
              notifications.map((notif, i) => {
                const style = CATEGORY_STYLES[notif.category];
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !notif.read && handleMarkOne(notif.id)}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all hover:shadow-md ${
                        notif.read
                        ? 'border-slate-100 bg-white'
                        : 'border-primary/20 bg-primary/5 shadow-sm'
                      }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                        {!notif.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{notif.body}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {timeAgo(notif.date)}
                      </p>
                    </div>
                    {notif.read && (
                      <CheckCircle size={16} className="mt-1 shrink-0 text-emerald-500" />
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
