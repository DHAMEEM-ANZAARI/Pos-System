import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, Role } from "../context/AuthContext";

export const ProtectedRoute = ({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};
