// src/Login.js
import React from "react";
import { useAuth } from "../../providers/AuthContext";
import { Redirect, useHistory } from "react-router-dom";
import { IonContent, IonPage } from "@ionic/react";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const history = useHistory();

  const handleLogin = () => {
    login();
    history.push("/app/tools");
  };

  return (
    <IonPage>
      <IonContent id="main-content">
        <h1>Login</h1>
        <button onClick={handleLogin}>Log in</button>
      </IonContent>
    </IonPage>
  );
};

export default Login;
