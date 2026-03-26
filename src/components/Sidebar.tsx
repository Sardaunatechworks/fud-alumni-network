import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  Users,
  GraduationCap,
  Menu,
  X,
  FileText,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from '../lib/db';

interface SidebarProps {
  role: 'student' | 'alumni' | 'admin';
}

export default function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard/student', icon: <LayoutDashboard size={20} /> },
    { name: 'Find Mentors', path: '/dashboard/student/mentors', icon: <Search size={20} /> },
    { name: 'Chat Session', path: '/dashboard/student/chat', icon: <MessageSquare size={20} /> },
    { name: 'Notifications', path: '/dashboard/student/notifications', icon: <Bell size={20} /> },
    { name: 'Profile Settings', path: '/dashboard/student/settings', icon: <Settings size={20} /> },
  ];

  const alumniLinks = [
    { name: 'Dashboard', path: '/dashboard/alumni', icon: <LayoutDashboard size={20} /> },
    { name: 'Mentees', path: '/dashboard/alumni/mentees', icon: <Users size={20} /> },
    { name: 'Chat Session', path: '/dashboard/alumni/chat', icon: <MessageSquare size={20} /> },
    { name: 'Notifications', path: '/dashboard/alumni/notifications', icon: <Bell size={20} /> },
    { name: 'Profile Settings', path: '/dashboard/alumni/settings', icon: <Settings size={20} /> },
  ];

  const adminLinks = [
    { name: 'Overview', path: '/dashboard/admin', icon: <Activity size={20} /> },
    { name: 'Alumni Approvals', path: '/dashboard/admin/approvals', icon: <Users size={20} /> },
    { name: 'User Management', path: '/dashboard/admin/users', icon: <Users size={20} /> },
    { name: 'Session Logs', path: '/dashboard/admin/sessions', icon: <FileText size={20} /> },
    { name: 'Trust & Safety', path: '/dashboard/admin/safety', icon: <AlertTriangle size={20} /> },
    { name: 'Admin Settings', path: '/dashboard/admin/settings', icon: <Settings size={20} /> },
  ];

  const getLinks = () => {
    if (role === 'student') return studentLinks;
    if (role === 'alumni') return alumniLinks;
    return adminLinks;
  };

  const links = getLinks();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-primary-dark shadow-lg ring-1 ring-slate-200 backdrop-blur-md transition-all active:scale-95 lg:hidden"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 transform bg-primary-dark text-white transition-all duration-300 ease-in-out lg:w-64 lg:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col px-4 py-6">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary-dark overflow-hidden">
              {/* Optional: Show user avatar if we have access to context here, 
                  but Sidebar doesn't have useAuth yet. Let's just improve the icon area. */}
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">FUD Alumni</span>
          </div>

          <nav className="flex-1 space-y-1">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
                  ${location.pathname === link.path || (link.path === '/dashboard/admin' && location.pathname === '/dashboard/admin/')
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'}
                `}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-400/10"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
