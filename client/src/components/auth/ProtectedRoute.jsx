import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-terra-muted animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
