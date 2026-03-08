import type {
  User, Session, Report, AdminConfig, MentorshipRequest, Chat, Message, AppNotification
} from '../types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  users: 'fud_users',
  currentUser: 'fud_current_user',
  sessions: 'fud_sessions',
  reports: 'fud_reports',
  adminConfig: 'fud_admin_config',
  requests: 'fud_mentorship_requests',
  chats: 'fud_chats',
  notifications: 'fud_notifications',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const read = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
};
const write = <T>(key: string, value: T) =>
  localStorage.setItem(key, JSON.stringify(value));

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (): User[] => read<User[]>(KEYS.users) ?? [];
export const saveUser = (user: User): void => {
  write(KEYS.users, [...getUsers(), user]);
};
export const updateUser = (updated: User): void => {
  write(KEYS.users, getUsers().map(u => (u.id === updated.id ? updated : u)));
};
export const updateUserStatus = (userId: string, status: User['status']): void => {
  updateUser({ ...getUsers().find(u => u.id === userId)!, status });
};
export const deleteUser = (userId: string): void => {
  write(KEYS.users, getUsers().filter(u => u.id !== userId));
};

// ─── Current User ─────────────────────────────────────────────────────────────
export const getCurrentUser = (): User | null => read<User>(KEYS.currentUser);
export const setCurrentUser = (user: User | Omit<User, 'password'>): void =>
  write(KEYS.currentUser, user);
export const logout = (): void => localStorage.removeItem(KEYS.currentUser);

// ─── Admin Config ─────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: AdminConfig = { autoApproval: false, maintenanceMode: false };
export const getAdminConfig = (): AdminConfig =>
  read<AdminConfig>(KEYS.adminConfig) ?? DEFAULT_CONFIG;
export const saveAdminConfig = (config: AdminConfig): void =>
  write(KEYS.adminConfig, config);

// ─── Sessions ─────────────────────────────────────────────────────────────────
const DEFAULT_SESSIONS: Session[] = [
  { id: 'SES-901', mentor: 'Dr. Jane Smith', mentee: 'John Doe', date: '2026-02-25 14:00', status: 'Completed', duration: '45m' },
  { id: 'SES-902', mentor: 'Engr. Musa Bello', mentee: 'Samuel Okon', date: '2026-02-25 10:30', status: 'Completed', duration: '60m' },
  { id: 'SES-903', mentor: 'Aisha Yusuf', mentee: 'Grace Aminu', date: '2026-02-26 09:00', status: 'Scheduled', duration: '-' },
  { id: 'SES-904', mentor: 'Dr. Jane Smith', mentee: 'Fatima Aliyu', date: '2026-02-26 15:00', status: 'Scheduled', duration: '-' },
];
export const getSessions = (): Session[] =>
  read<Session[]>(KEYS.sessions) ?? DEFAULT_SESSIONS;
export const saveSessions = (sessions: Session[]): void =>
  write(KEYS.sessions, sessions);

// ─── Reports ──────────────────────────────────────────────────────────────────
const DEFAULT_REPORTS: Report[] = [
  { id: 'rep-1', reporter: 'John Doe', reported: 'Dr. Jane Smith', reason: 'Unprofessional conduct during session', date: '2026-02-25', severity: 'Medium' },
  { id: 'rep-2', reporter: 'Aisha Yusuf', reported: 'Samuel Okon', reason: 'Spamming message requests', date: '2026-02-24', severity: 'Low' },
];
export const getReports = (): Report[] =>
  read<Report[]>(KEYS.reports) ?? DEFAULT_REPORTS;
export const saveReports = (reports: Report[]): void =>
  write(KEYS.reports, reports);

// ─── Mentorship Requests ──────────────────────────────────────────────────────
export const getMentorshipRequests = (): MentorshipRequest[] =>
  read<MentorshipRequest[]>(KEYS.requests) ?? [];
export const saveMentorshipRequests = (requests: MentorshipRequest[]): void =>
  write(KEYS.requests, requests);
export const addMentorshipRequest = (req: MentorshipRequest): void => {
  saveMentorshipRequests([...getMentorshipRequests(), req]);
};
export const updateRequestStatus = (
  requestId: string,
  status: MentorshipRequest['status']
): void => {
  saveMentorshipRequests(
    getMentorshipRequests().map(r => (r.id === requestId ? { ...r, status } : r))
  );
};

// ─── Chats & Messages ─────────────────────────────────────────────────────────
export const getChats = (): Chat[] => read<Chat[]>(KEYS.chats) ?? [];
export const saveChats = (chats: Chat[]): void => write(KEYS.chats, chats);

export const getOrCreateChat = (
  studentId: string, studentName: string,
  alumniId: string, alumniName: string
): Chat => {
  const chats = getChats();
  const chatId = `${studentId}_${alumniId}`;
  const existing = chats.find(c => c.id === chatId);
  if (existing) return existing;
  const newChat: Chat = {
    id: chatId,
    studentId, studentName,
    alumniId, alumniName,
    messages: [],
    lastMessage: '',
    lastTime: '',
    unreadByStudent: 0,
    unreadByAlumni: 0,
  };
  saveChats([...chats, newChat]);
  return newChat;
};

export const sendMessage = (
  chatId: string,
  text: string,
  sender: 'student' | 'alumni',
  senderId: string
): void => {
  const chats = getChats();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = 'Today';
  const msg: Message = {
    id: Date.now().toString(),
    chatId,
    text,
    sender,
    senderId,
    time: timeStr,
    status: 'sent',
    date: dateStr,
  };
  const updated = chats.map(c => {
    if (c.id !== chatId) return c;
    return {
      ...c,
      messages: [...c.messages, msg],
      lastMessage: text,
      lastTime: timeStr,
      unreadByStudent: sender === 'alumni' ? c.unreadByStudent + 1 : c.unreadByStudent,
      unreadByAlumni: sender === 'student' ? c.unreadByAlumni + 1 : c.unreadByAlumni,
    };
  });
  saveChats(updated);
};

export const markChatRead = (chatId: string, role: 'student' | 'alumni'): void => {
  const chats = getChats().map(c => {
    if (c.id !== chatId) return c;
    return {
      ...c,
      unreadByStudent: role === 'student' ? 0 : c.unreadByStudent,
      unreadByAlumni: role === 'alumni' ? 0 : c.unreadByAlumni,
    };
  });
  saveChats(chats);
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = (userId: string): AppNotification[] =>
  (read<AppNotification[]>(KEYS.notifications) ?? []).filter(n => n.userId === userId);

export const saveNotifications = (notifications: AppNotification[]): void =>
  write(KEYS.notifications, notifications);

export const addNotification = (n: AppNotification): void => {
  const all = read<AppNotification[]>(KEYS.notifications) ?? [];
  write(KEYS.notifications, [...all, n]);
};

export const markNotificationRead = (notifId: string): void => {
  const all = read<AppNotification[]>(KEYS.notifications) ?? [];
  write(KEYS.notifications, all.map(n => n.id === notifId ? { ...n, read: true } : n));
};

export const markAllNotificationsRead = (userId: string): void => {
  const all = read<AppNotification[]>(KEYS.notifications) ?? [];
  write(KEYS.notifications, all.map(n => n.userId === userId ? { ...n, read: true } : n));
};
