import { Outlet } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute() {
  // Check from browser memory did we login
  const isAuthenticated = localStorage.getItem("token") !== null;

  // If we have no token, redirected to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If token exists we let the user to that site
  return <Outlet />;
}