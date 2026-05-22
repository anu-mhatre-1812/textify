import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import Spinner from '@/components/Shared/Spinner';
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return <Spinner fullscreen label="Loading Textify..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return <Spinner fullscreen label="Loading Textify..." />;
  }

  if (user && profile) {
    return <Navigate to="/chat" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
