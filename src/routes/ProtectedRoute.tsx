import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";
import { IonRoute } from "@ionic/react";

const ProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
