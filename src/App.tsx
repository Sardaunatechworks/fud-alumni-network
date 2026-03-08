import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import StudentSignup from './pages/StudentSignup';
import AlumniSignup from './pages/AlumniSignup';
import AdminSignup from './pages/AdminSignup';
import PendingApproval from './pages/PendingApproval';
import StudentDashboard from './pages/StudentDashboard';
import FindMentors from './pages/student/FindMentors';
import ChatSession from './pages/student/ChatSession';
import Notifications from './pages/student/Notifications';
import ProfileSettings from './pages/student/ProfileSettings';
import AlumniDashboard from './pages/AlumniDashboard';
import AlumniMentees from './pages/alumni/Mentees';
import AlumniChat from './pages/alumni/ChatSession';
import AlumniSettings from './pages/alumni/ProfileSettings';
import AlumniNotifications from './pages/alumni/Notifications';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/alumni" element={<AlumniSignup />} />
        <Route path="/signup/admin" element={<AdminSignup />} />

        {/* Semi-public: only logged-in alumni awaiting approval */}
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Student routes */}
        <Route path="/dashboard/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/student/mentors" element={<ProtectedRoute role="student"><FindMentors /></ProtectedRoute>} />
        <Route path="/dashboard/student/chat" element={<ProtectedRoute role="student"><ChatSession /></ProtectedRoute>} />
        <Route path="/dashboard/student/notifications" element={<ProtectedRoute role="student"><Notifications /></ProtectedRoute>} />
        <Route path="/dashboard/student/settings" element={<ProtectedRoute role="student"><ProfileSettings /></ProtectedRoute>} />

        {/* Alumni routes */}
        <Route path="/dashboard/alumni" element={<ProtectedRoute role="alumni"><AlumniDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/alumni/mentees" element={<ProtectedRoute role="alumni"><AlumniMentees /></ProtectedRoute>} />
        <Route path="/dashboard/alumni/chat" element={<ProtectedRoute role="alumni"><AlumniChat /></ProtectedRoute>} />
        <Route path="/dashboard/alumni/notifications" element={<ProtectedRoute role="alumni"><AlumniNotifications /></ProtectedRoute>} />
        <Route path="/dashboard/alumni/settings" element={<ProtectedRoute role="alumni"><AlumniSettings /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/dashboard/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/admin/:tab" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
