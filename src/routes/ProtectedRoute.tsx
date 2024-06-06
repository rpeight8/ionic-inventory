import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

const ProtectedRoute = ({
  children,
  ...rest
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
