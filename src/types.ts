// ─── Shared Types ───────────────────────────────────────────────────────────

export type UserRole = 'student' | 'alumni' | 'admin';
export type UserStatus = 'active' | 'pending' | 'rejected';
export type MessageSender = 'student' | 'alumni' | 'mentor';
export type SessionStatus = 'Completed' | 'Scheduled';
export type ReportSeverity = 'Low' | 'Medium' | 'High';
export type NotificationCategory = 'request' | 'message' | 'session' | 'system';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    department?: string;
    faculty?: string;
    graduationYear?: string;
    expertise?: string;
    interests?: string[];
    level?: string;       // e.g. "300 Level"
    bio?: string;
    avatarUrl?: string;
    createdAt?: string;
}

// ─── Mentorship Request ───────────────────────────────────────────────────────

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface MentorshipRequest {
    id: string;
    studentId: string;
    studentName: string;
    studentDept: string;
    studentLevel: string;
    alumniId: string;
    alumniName: string;
    reason: string;
    date: string;       // ISO date string
    status: RequestStatus;
    studentAvatarUrl?: string;
    alumniAvatarUrl?: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
    id: string;
    chatId: string;
    text: string;
    sender: 'student' | 'alumni';
    senderId: string;
    time: string;
    status: 'sent' | 'delivered' | 'read';
    date: string;
}

export interface Chat {
    id: string;              // e.g. `${studentId}_${alumniId}`
    studentId: string;
    studentName: string;
    alumniId: string;
    alumniName: string;
    messages: Message[];
    lastMessage: string;
    lastTime: string;
    unreadByStudent: number;
    unreadByAlumni: number;
    studentAvatarUrl?: string;
    alumniAvatarUrl?: string;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
    id: string;
    mentor: string;
    mentee: string;
    date: string;
    status: SessionStatus;
    duration: string;
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface Report {
    id: string;
    reporter: string;
    reported: string;
    reason: string;
    date: string;
    severity: ReportSeverity;
}

// ─── Admin Config ─────────────────────────────────────────────────────────────

export interface AdminConfig {
    autoApproval: boolean;
    maintenanceMode: boolean;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface AppNotification {
    id: string;
    userId: string;
    category: NotificationCategory;
    title: string;
    body: string;
    read: boolean;
    date: string;
    relatedId?: string;   // e.g. request id or chat id
}

// ─── Mentor (Static profile used in FindMentors) ─────────────────────────────

export interface MentorProfile {
    id: number;
    name: string;
    role: string;
    company: string;
    location: string;
    dept: string;
    expertise: string[];
    skills: string[];
    rating: number;
    reviews: number;
    image: string;
    isAvailable: boolean;
    mentorshipApproach: string;
    alumniId?: string;   // links to a User id if the mentor is a registered alumni
}
