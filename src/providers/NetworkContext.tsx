// src/NetworkContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import NetworkService from "../services/Network";

const NetworkContext = createContext<{
  isOnline: boolean;
  updateNetworkStatus?: () => Promise<void>;
}>({
  isOnline: false,
});

const ping = async () => {
  try {
    const response = await fetch("https://www.google.com");
    return response.ok;
  } catch (error) {
    return false;
  }
};

const getNetworkStatus = async () => {
  const status = await NetworkService.getStatus();
  if (status.connected) {
    const isReachable = await ping();
    return isReachable;
  } else {
    return false;
  }
};

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOnline, setIsOnline] = useState(false);

  const updateNetworkStatus = useCallback(async () => {
    const isOnline = await getNetworkStatus();
    setIsOnline(isOnline);
  }, []);

  useEffect(() => {
    NetworkService.addListener("networkStatusChange", async () => {
      updateNetworkStatus();
    });

    return () => {
      NetworkService.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  return (
    <NetworkContext.Provider value={{ isOnline, updateNetworkStatus }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
