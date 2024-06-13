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
let taskQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  while (taskQueue.length > 0) {
    const task = taskQueue.shift();
    if (task) {
      await task();
    }
  }

  isProcessingQueue = false;
};

const queueTask = <T>(task: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    taskQueue.push(async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    processQueue();
  });
};

const initializeInternal = async () => {
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
};

const getToolsInternal = async (): Promise<Tool[]> => {
  if (!storage) {
    throw new Error("Storage not initialized");
  }

  const tools = await storage.get("tools");
  return tools ?? [];
};

const setToolsInternal = async (tools: Tool[]): Promise<void> => {
  if (!storage) {
    throw new Error("Storage not initialized");
  }

  await storage.set("tools", tools);
};

const createToolInternal = async (tool: Tool): Promise<void> => {
  if (!storage) {
    throw new Error("Storage not initialized");
  }
  const tools = await getToolsInternal();
  tools.push(tool);
  await storage.set("tools", tools);
};

const StorageService: StorageService = {
  async initialize() {
    return queueTask(() => initializeInternal());
  },

  getDriver() {
    return storage ? storage.driver ?? undefined : undefined;
  },

  async getTools() {
    return queueTask(() => getToolsInternal());
  },

  async setTools(tools: Tool[]) {
    return queueTask(() => setToolsInternal(tools));
  },

  async createTool(tool: Tool) {
    return queueTask(() => createToolInternal(tool));
  },
};

export default StorageService;
export type { StorageService };
