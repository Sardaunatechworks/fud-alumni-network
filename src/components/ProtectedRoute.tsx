import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: UserRole;
}

/**
 * Wraps protected pages. Redirects to /login if not authenticated.
 * Optionally redirects to the correct dashboard if the role doesn't match.
 */
export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  // Show nothing while the auth session is loading from Supabase
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-900 border-t-transparent" />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (role && profile.role !== role) {
    const dashboards: Record<UserRole, string> = {
      student: '/dashboard/student',
      alumni: '/dashboard/alumni',
      admin: '/dashboard/admin',
    };
    return <Navigate to={dashboards[profile.role as UserRole]} replace />;
  }

  return <>{children}</>;
}
