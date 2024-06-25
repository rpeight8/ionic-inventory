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

type StorageServiceType = {
  initialize: () => Promise<void>;
  getDriver: () => string | undefined;
  getTools: () => Promise<Tool[]>;
  setTools: (tools: Tool[]) => Promise<unknown>;
  addTool: (tool: Tool) => Promise<unknown>;
  createTool: (tool: Tool) => Promise<unknown>;
  getScheduledActions: () => Promise<any[]>;
  setScheduledActions: (scheduledActions: any[]) => Promise<unknown>;
  setIdMapping: (idMapping: LocalToServerMapping) => Promise<unknown>;
  getIdMapping: () => Promise<IdMappingResult>;
};

class StorageService implements StorageServiceType {
  private static instance: StorageService;
  private storage: IonicStorage | undefined;
  private initialized = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.storage = new IonicStorage({
      driverOrder: [
        CordovaSQLiteDriver._driver,
        Drivers.IndexedDB,
        Drivers.LocalStorage,
      ],
    });
    try {
      await this.storage.defineDriver(CordovaSQLiteDriver);
      await this.storage.create();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize storage service", error);
      this.initialized = false;
      throw new Error("Failed to initialize storage service");
    }
  }

  public getDriver(): string | undefined {
    if (!this.storage) {
      return undefined;
    }
    return this.storage.driver ?? undefined;
  }

  public async getTools(): Promise<Tool[]> {
    return queue.queueTask(
      {
        action: () => this.getToolsInternal(),
      },
      true
    );
  }

  public async setTools(tools: Tool[]): Promise<void> {
    return queue.queueTask(
      {
        action: () => this.setToolsInternal(tools),
      },
      true
    );
  }

  public async createTool(tool: Tool): Promise<void> {
    return queue.queueTask(
      {
        action: () => this.createToolInternal(tool),
      },
      true
    );
  }

  public async addTool(tool: Tool): Promise<void> {
    return queue.queueTask(
      {
        action: () => this.addToolInternal(tool),
      },
      true
    );
  }

  public async getScheduledActions(): Promise<any[]> {
    return queue.queueTask(
      {
        action: () => this.getScheduledActionsInternal(),
      },
      true
    );
  }

  public async setScheduledActions(scheduledActions: any[]): Promise<void> {
    return queue.queueTask(
      {
        action: () => this.setScheduledActionsInternal(scheduledActions),
      },
      true
    );
  }

  public async setIdMapping(idMapping: Record<string, string>): Promise<void> {
    return this.setIdMappingInternal(idMapping);
  }

  public async getIdMapping(): Promise<IdMappingResult> {
    return this.getIdMappingInternal();
  }

  private async getToolsInternal(): Promise<Tool[]> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }

    const tools = await this.storage.get("tools");
    return tools ?? [];
  }

  private async setToolsInternal(tools: Tool[]): Promise<void> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }

    await this.storage.set("tools", tools);
  }

  private async createToolInternal(tool: Tool): Promise<void> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }
    const tools = await this.getToolsInternal();
    tools.push(tool);
    await this.storage.set("tools", tools);
  }

  private async addToolInternal(tool: Tool): Promise<void> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }
    const tools = await this.getToolsInternal();
    tools.push(tool);
    await this.storage.set("tools", tools);
  }

  private async getIdMappingInternal(): Promise<IdMappingResult> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }
    const localToServerMapping = Object.assign(
      {},
      ((await this.storage.get("idMapping")) ?? {}) as LocalToServerMapping
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
  }

  private async getScheduledActionsInternal(): Promise<any[]> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }
    const scheduledActions = await this.storage.get("scheduledActions");

    return scheduledActions ?? [];
  }

  private async setScheduledActionsInternal(
    scheduledActions: any[]
  ): Promise<void> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }
    await this.storage.set("scheduledActions", scheduledActions);
  }

  private async setIdMappingInternal(
    idMapping: LocalToServerMapping
  ): Promise<void> {
    if (!this.storage) {
      throw new Error("Storage not initialized");
    }
    await this.storage.set("idMapping", idMapping);
  }
}

export default StorageService;
export type { StorageServiceType };
