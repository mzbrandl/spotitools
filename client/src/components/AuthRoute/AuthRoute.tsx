import React from "react";
import { Navigate } from "react-router-dom";

interface AuthRouteProps {
  isLoggedIn: boolean;
  children: React.ReactNode;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({
  isLoggedIn,
  children,
}) => {
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
