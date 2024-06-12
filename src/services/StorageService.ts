import CordovaSQLiteDriver from "localforage-cordovasqlitedriver";
import { Drivers, Storage as IonicStorage } from "@ionic/storage";
import type { Tool } from "../types";

type StorageService = {
  initialize: () => Promise<void>;
  getDriver: () => string | undefined;
  getTools: () => Promise<Tool[]>;
  setTools: (tools: Tool[]) => Promise<void>;
  createTool: (tool: Tool) => Promise<void>;
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

  async getTools() {
    if (!storage) {
      throw new Error("Storage not initialized");
    }

    const tools = await storage.get("tools");
    return tools ?? [];
  },

  async setTools(tools) {
    if (!storage) {
      throw new Error("Storage not initialized");
    }

    await storage.set("tools", tools);
  },

  async createTool(tool) {
    if (!storage) {
      throw new Error("Storage not initialized");
    }

    const tools = await StorageService.getTools();
    tools.push(tool);
    await storage.set("tools", tools);
  },
};

export default StorageService;
export type { StorageService };
