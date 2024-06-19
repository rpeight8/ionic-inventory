import React from "react";
import { Redirect } from "react-router";
import { useAuth } from "../providers/AuthContext";
import { IonPage, IonRoute } from "@ionic/react";

const ProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <IonPage>
        <Redirect to="/login" />
      </IonPage>
    );
  }

  return children;
};

export default ProtectedRoute;
