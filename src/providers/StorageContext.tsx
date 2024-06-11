import React, { createContext, useContext, useEffect, useState } from "react";
import StorageService from "../services/Storage";

type StorageReadyState = boolean;
type StorageDriver = string | undefined;

const StorageContext = createContext<{
  storageReady: StorageReadyState;
  storageDriver: StorageDriver;
}>({
  storageReady: false,
  storageDriver: undefined,
});

export const StorageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [storageReady, setStorageReady] = useState<StorageReadyState>(false);
  const [storageDriver, setStorageDriver] = useState<StorageDriver>(undefined);

  useEffect(() => {
    const initializeStorage = async () => {
      await StorageService.initialize();
      setStorageDriver(StorageService.getDriver());
      setStorageReady(true);
    };
    try {
      initializeStorage();
    } catch (error) {
      console.error("An error occurred while initializing storage:", error);
    }
  }, []);

  return (
    <StorageContext.Provider value={{ storageReady, storageDriver }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => useContext(StorageContext);
