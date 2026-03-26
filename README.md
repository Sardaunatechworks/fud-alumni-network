# FUD Alumni Mentorship Network

## 🌟 Overview
The **FUD Alumni Mentorship Network** is a premium, real-time platform designed to bridge the gap between Federal University Dutse (FUD) students and experienced alumni. It facilitates professional growth through direct mentorship, peer-to-peer networking, and industry-standard communication tools.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (Modern, high-performance styling)
- **Icons**: Lucide React
- **Animations**: Framer Motion & Motion (Smooth transitions)
- **Routing**: React Router v7

### Backend (Supabase)
- **Database**: PostgreSQL (Relational data management)
- **Authentication**: Supabase Auth (Email/Password & Metadata)
- **Storage**: Supabase Storage (Profile avatar persistence)
- **Real-time**: Postgres Changes (Live chat and instant notifications)

---

## 📁 Project Structure

```text
src/
├── components/     # Layout-level and reusable UI components
├── lib/            # Core logic (Supabase client, db interactions, Auth)
├── pages/          # Page components grouped by user role
│   ├── admin/      # Admin-only views (Reports, User Management)
│   ├── alumni/     # Alumni features (Chat, Mentees list, Profile)
│   └── student/    # Student features (Find Mentors, Requests, Chat)
├── types/          # Centralized TypeScript interfaces
└── main.tsx        # Application entry point
```

---

## 📐 Development Guidelines

### 1. Database & Schema
- **Supabase First**: All backend logic must reside in `src/lib/db.ts` to maintain a clean abstraction.
- **RLS (Security)**: Every new table MUST have Row Level Security enabled. Never query secret columns (like passwords) directly.
- **Migrations**: Always maintain a `supabase_schema.sql` at the root for easy staging and production deployment.

### 2. UI/UX & Design System
- **FUD Branding**: Use the official FUD Green (`#018542`) and Gold accents. 
- **Premium Aesthetics**: Prioritize rounded corners (`rounded-2xl` or `rounded-3xl`), subtle shadows (`shadow-sm` with `hover:shadow-xl`), and smooth transitions using Framer Motion.
- **Responsive Design**: Ensure every page is mobile-first, utilizing `lg:pl-64` for fixed sidebars.

### 3. State & Authentication
- **Auth Context**: Use the `useAuth` hook for all user-specific logic. Do not store sensitive session data in localStorage manually.
- **Real-time**: Use Supabase's `on().subscribe()` for chat messages and notifications to avoid unnecessary manual polling.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- A Supabase Project

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```bash
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Setup Storage
Ensure you run the SQL provided in the **STORAGE** section of `supabase_schema.sql` (found at the bottom of the file) in your **Supabase Dashboard > SQL Editor**. This creates the `avatars` bucket and sets up public access policies.

---

## 🤝 Contribution Workflow
1. **Branching**: Use descriptive branch names (e.g., `feature/chat-fix`, `style/dashboard-overhaul`).
2. **Commit Messages**: Follow standard patterns: `category: brief description`.
3. **Pull Requests**: Pull from `origin main` before submitting to ensure your branch is current.

---

## 🛡️ License
This project is proprietary for the Federal University Dutse Alumni Network.
