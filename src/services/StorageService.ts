import CordovaSQLiteDriver from "localforage-cordovasqlitedriver";
import { Drivers, Storage as IonicStorage } from "@ionic/storage";
import type { Tool } from "../types";
import TaskQueue from "../utils/TaskQueue";
import type { Task } from "../utils/TaskQueue";

const queue = new TaskQueue();

type IdMapping = Record<string, string>;
type LocalToServerMapping = IdMapping;
type ServerToLocalMapping = IdMapping;
type IdMappingResult = {
  localToServer: LocalToServerMapping;
  serverToLocal: ServerToLocalMapping;
};

type StorageService = {
  initialize: () => Promise<void>;
  getDriver: () => string | undefined;
  getTools: () => Promise<Tool[]>;
  setTools: (tools: Tool[]) => Promise<unknown>;
  addTool: (tool: Tool) => Promise<unknown>;
  createTool: (tool: Tool) => Promise<unknown>;
  setIdMapping: (idMapping: LocalToServerMapping) => Promise<unknown>;
  getIdMapping: () => Promise<IdMappingResult>;
};

let storage: IonicStorage | undefined;

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

const addToolInternal = async (tool: Tool): Promise<void> => {
  if (!storage) {
    throw new Error("Storage not initialized");
  }
  const tools = await getToolsInternal();
  tools.push(tool);
  await storage.set("tools", tools);
};

const getIdMappingInternal = async (): Promise<IdMappingResult> => {
  if (!storage) {
    throw new Error("Storage not initialized");
  }
  const localToServerMapping = Object.assign(
    {},
    ((await storage.get("idMapping")) ?? {}) as LocalToServerMapping
  );
  const serverToLocalMapping = Object.entries(localToServerMapping).reduce(
    (acc, [key, value]) => {
      acc[value] = key;
      return acc;
    },
    {} as ServerToLocalMapping
  );

  return {
    localToServer: localToServerMapping,
    serverToLocal: serverToLocalMapping,
  };
};

const setIdMappingInternal = async (idMapping: LocalToServerMapping) => {
  if (!storage) {
    throw new Error("Storage not initialized");
  }
  return await storage.set("idMapping", idMapping);
};

const StorageService: StorageService = {
  async initialize() {
    if (storage) {
      return;
    }

    return initializeInternal();
  },

  getDriver() {
    if (!storage) {
      return undefined;
    }
    return storage ? storage.driver ?? undefined : undefined;
  },

  async getTools() {
    return queue.queueTask(
      {
        action: () => getToolsInternal(),
      },
      true
    );
  },

  async setTools(tools: Tool[]) {
    return queue.queueTask(
      {
        action: () => setToolsInternal(tools),
      },
      true
    );
  },

  async createTool(tool: Tool) {
    return queue.queueTask(
      {
        action: () => createToolInternal(tool),
      },
      true
    );
  },

  async addTool(tool: Tool) {
    return queue.queueTask(
      {
        action: () => addToolInternal(tool),
      },
      true
    );
  },

  async setIdMapping(idMapping: Record<string, string>) {
    return setIdMappingInternal(idMapping);
  },

  async getIdMapping() {
    return getIdMappingInternal();
  },
};

export default StorageService;
export type { StorageService };
