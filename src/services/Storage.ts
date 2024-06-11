import CordovaSQLiteDriver from "localforage-cordovasqlitedriver";
import { Drivers, Storage as IonicStorage } from "@ionic/storage";

type StorageService = {
  initialize: () => Promise<void>;
  getDriver: () => string | undefined;
};

let storage: IonicStorage | undefined;

const StorageService: StorageService = {
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

export default StorageService;
export type { StorageService };
