// src/Login.js
import React from "react";
import { useAuth } from "../../AuthContext";
import { useHistory } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = () => {
    login();
    history.push("/");
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Log in</button>
    </div>
  );
};

export default Login;
