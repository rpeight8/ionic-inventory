import CordovaSQLiteDriver from "localforage-cordovasqlitedriver";
import { Drivers, Storage as IonicStorage } from "@ionic/storage";

type Storage = {
  initialize: () => Promise<void>;
  getDriver: () => string | undefined;
};

let storage: IonicStorage | undefined;

const Storage: Storage = {
  async initialize() {
    if (!storage) {
      storage = new IonicStorage({
        driverOrder: [
          CordovaSQLiteDriver._driver,
          Drivers.IndexedDB,
          Drivers.LocalStorage,
        ],
      });
      await storage.defineDriver(CordovaSQLiteDriver);
      await storage.create();
    }
  },

  getDriver() {
    return storage ? storage.driver ?? undefined : undefined;
  },
};

export { Storage };
