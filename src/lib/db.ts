/**
 * db.ts — Supabase data layer
 * Replaces the old localStorage-based utils/auth.ts
 * All functions are async and return typed data from Supabase.
 */
import { supabase } from '../lib/supabase';
import type {
    User, MentorshipRequest, Chat, Message,
    AppNotification, Session, Report, AdminConfig,
} from '../types';

// ─── Helper: map DB profile row → User ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any): User {
    return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        status: row.status,
        department: row.department ?? undefined,
        faculty: row.faculty ?? undefined,
        graduationYear: row.graduation_year ?? undefined,
        expertise: row.expertise ?? undefined,
        bio: row.bio ?? undefined,
        level: row.level ?? undefined,
        interests: row.interests ?? undefined,
        password: '', // never stored client-side
        createdAt: row.created_at ?? undefined,
    };
}

// ─── Helper: map DB mentorship_request row → MentorshipRequest ────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRequest(row: any, studentProfile?: any, alumniProfile?: any): MentorshipRequest {
    return {
        id: row.id,
        studentId: row.student_id,
        studentName: studentProfile?.full_name ?? row.student_id,
        studentDept: studentProfile?.department ?? '',
        studentLevel: studentProfile?.level ?? '',
        alumniId: row.alumni_id,
        alumniName: alumniProfile?.full_name ?? row.alumni_id,
        reason: row.reason ?? '',
        date: row.created_at ?? new Date().toISOString(),
        status: row.status,
    };
}

// ─── Helper: map DB message row → Message ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(row: any): Message {
    const d = new Date(row.created_at);
    return {
        id: row.id,
        chatId: row.chat_id,
        text: row.text,
        sender: row.sender,
        senderId: row.sender_id,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: row.status ?? 'sent',
        date: 'Today',
    };
}

// ─── Helper: map DB notification row → AppNotification ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(row: any): AppNotification {
    return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        title: row.title,
        body: row.body,
        read: row.read ?? false,
        date: row.created_at ?? new Date().toISOString(),
        relatedId: row.related_id ?? undefined,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

export async function signUp(
    email: string,
    password: string,
    meta: {
        full_name: string;
        role: User['role'];
        status: User['status'];
        department?: string;
        faculty?: string;
        graduation_year?: string;
        expertise?: string;
        interests?: string[];
        level?: string;
        bio?: string;
    }
) {
    return supabase.auth.signUp({
        email,
        password,
        options: { data: meta },
    });
}

export async function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
    return supabase.auth.signOut();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILES / USERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) { console.error(error); return []; }
    return (data ?? []).map(mapProfile);
}

export async function getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return null;
    return mapProfile(data);
}

export async function getAlumni(): Promise<User[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .eq('status', 'active');
    if (error) { console.error(error); return []; }
    return (data ?? []).map(mapProfile);
}

export async function updateProfile(userId: string, updates: Partial<Omit<User, 'id' | 'role' | 'password' | 'email'>>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.faculty !== undefined) dbUpdates.faculty = updates.faculty;
    if (updates.graduationYear !== undefined) dbUpdates.graduation_year = updates.graduationYear;
    if (updates.expertise !== undefined) dbUpdates.expertise = updates.expertise;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.interests !== undefined) dbUpdates.interests = updates.interests;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) console.error('updateProfile error:', error);
}

export async function updateUserStatus(userId: string, status: User['status']): Promise<void> {
    await updateProfile(userId, { status });
}

export async function deleteUser(userId: string): Promise<void> {
    // Deleting the profile cascades; the auth user row requires admin/service role
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) console.error('deleteUser error:', error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENTORSHIP REQUESTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getMentorshipRequests(): Promise<MentorshipRequest[]> {
    const { data, error } = await supabase
        .from('mentorship_requests')
        .select('*, student:profiles!student_id(*), alumni:profiles!alumni_id(*)')
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(row => mapRequest(row, row.student, row.alumni));
}

export async function getMentorshipRequestsForAlumni(alumniId: string): Promise<MentorshipRequest[]> {
    const { data, error } = await supabase
        .from('mentorship_requests')
        .select('*, student:profiles!student_id(*), alumni:profiles!alumni_id(*)')
        .eq('alumni_id', alumniId)
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(row => mapRequest(row, row.student, row.alumni));
}

export async function getMentorshipRequestsForStudent(studentId: string): Promise<MentorshipRequest[]> {
    const { data, error } = await supabase
        .from('mentorship_requests')
        .select('*, student:profiles!student_id(*), alumni:profiles!alumni_id(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(row => mapRequest(row, row.student, row.alumni));
}

export async function addMentorshipRequest(
    studentId: string,
    alumniId: string,
    reason: string
): Promise<MentorshipRequest | null> {
    const { data, error } = await supabase
        .from('mentorship_requests')
        .insert({ student_id: studentId, alumni_id: alumniId, reason })
        .select('*, student:profiles!student_id(*), alumni:profiles!alumni_id(*)')
        .single();
    if (error) { console.error(error); return null; }
    return mapRequest(data, data.student, data.alumni);
}

export async function updateRequestStatus(
    requestId: string,
    status: MentorshipRequest['status']
): Promise<void> {
    const { error } = await supabase
        .from('mentorship_requests')
        .update({ status })
        .eq('id', requestId);
    if (error) console.error('updateRequestStatus error:', error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHATS & MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getChatsForUser(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
        .from('chats')
        .select('*, student:profiles!student_id(full_name), alumni:profiles!alumni_id(full_name)')
        .or(`student_id.eq.${userId},alumni_id.eq.${userId}`)
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(row => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student?.full_name ?? row.student_id,
        alumniId: row.alumni_id,
        alumniName: row.alumni?.full_name ?? row.alumni_id,
        messages: [],
        lastMessage: row.last_message ?? '',
        lastTime: row.last_time ?? '',
        unreadByStudent: row.unread_by_student ?? 0,
        unreadByAlumni: row.unread_by_alumni ?? 0,
    }));
}

export async function getOrCreateChat(
    studentId: string,
    studentName: string,
    alumniId: string,
    alumniName: string
): Promise<Chat> {
    const chatId = `${studentId}_${alumniId}`;
    const { data: existing } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .maybeSingle();

    if (existing) {
        return {
            id: existing.id,
            studentId: existing.student_id,
            studentName,
            alumniId: existing.alumni_id,
            alumniName,
            messages: [],
            lastMessage: existing.last_message ?? '',
            lastTime: existing.last_time ?? '',
            unreadByStudent: existing.unread_by_student ?? 0,
            unreadByAlumni: existing.unread_by_alumni ?? 0,
        };
    }

    const { data: created, error } = await supabase
        .from('chats')
        .insert({ id: chatId, student_id: studentId, alumni_id: alumniId })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return {
        id: created.id,
        studentId: created.student_id,
        studentName,
        alumniId: created.alumni_id,
        alumniName,
        messages: [],
        lastMessage: '',
        lastTime: '',
        unreadByStudent: 0,
        unreadByAlumni: 0,
    };
}

export async function getMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(mapMessage);
}

export async function sendMessage(
    chatId: string,
    text: string,
    sender: 'student' | 'alumni',
    senderId: string
): Promise<Message | null> {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const { data, error } = await supabase
        .from('messages')
        .insert({ chat_id: chatId, text, sender, sender_id: senderId })
        .select()
        .single();
    if (error) { console.error(error); return null; }

    // Update last message preview on the chat row
    await supabase
        .from('chats')
        .update({ last_message: text, last_time: timeStr })
        .eq('id', chatId);

    return mapMessage(data);
}

export async function markChatRead(chatId: string, role: 'student' | 'alumni'): Promise<void> {
    const field = role === 'student' ? 'unread_by_student' : 'unread_by_alumni';
    const { error } = await supabase.from('chats').update({ [field]: 0 }).eq('id', chatId);
    if (error) console.error('markChatRead error:', error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(mapNotification);
}

export async function addNotification(n: Omit<AppNotification, 'id' | 'date'>): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
        user_id: n.userId,
        category: n.category,
        title: n.title,
        body: n.body,
        read: n.read ?? false,
        related_id: n.relatedId ?? null,
    });
    if (error) console.error('addNotification error:', error);
}

export async function markNotificationRead(notifId: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    if (error) console.error('markNotificationRead error:', error);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);
    if (error) console.error('markAllNotificationsRead error:', error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSessions(): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').order('scheduled_at');
    if (error) { console.error(error); return []; }
    return (data ?? []).map(row => ({
        id: row.id,
        mentor: row.mentor,
        mentee: row.mentee,
        date: row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : '',
        status: row.status,
        duration: row.duration ?? '-',
    }));
}

export async function addSession(session: Omit<Session, 'id'>): Promise<void> {
    const { error } = await supabase.from('sessions').insert({
        mentor: session.mentor,
        mentee: session.mentee,
        scheduled_at: session.date ? new Date(session.date).toISOString() : null,
        status: session.status,
        duration: session.duration,
    });
    if (error) console.error('addSession error:', error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getReports(): Promise<Report[]> {
    const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reporter_id(full_name), reported:profiles!reported_id(full_name)')
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []).map(row => ({
        id: row.id,
        reporter: row.reporter?.full_name ?? row.reporter_id,
        reported: row.reported?.full_name ?? row.reported_id,
        reason: row.reason ?? '',
        date: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
        severity: row.severity,
    }));
}

export async function addReport(
    reporterId: string,
    reportedId: string,
    reason: string,
    severity: Report['severity']
): Promise<void> {
    const { error } = await supabase.from('reports').insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        severity,
    });
    if (error) console.error('addReport error:', error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAdminConfig(): Promise<AdminConfig> {
    const { data } = await supabase.from('admin_config').select('*').eq('id', 1).single();
    return {
        autoApproval: data?.auto_approval ?? false,
        maintenanceMode: data?.maintenance_mode ?? false,
    };
}

export async function saveAdminConfig(config: AdminConfig): Promise<void> {
    const { error } = await supabase.from('admin_config').upsert({
        id: 1,
        auto_approval: config.autoApproval,
        maintenance_mode: config.maintenanceMode,
    });
    if (error) console.error('saveAdminConfig error:', error);
}
