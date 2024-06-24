import StorageService from "./StorageService";
import type { StorageServiceType } from "./StorageService";
import { NewTool, Tool, Toolbox } from "../types";
import { v4 as uuidv4 } from "uuid";
import LocalServerConverterService from "./LocalServerConverterService";

class DataManagerService {
  private static instance: DataManagerService;
  private storageService: StorageServiceType;
  private localServerConverterService: LocalServerConverterService<any, any>;

  private constructor({
    StorageService,
    LocalServerConverterService,
  }: {
    StorageService: StorageServiceType;
    LocalServerConverterService: LocalServerConverterService<any, any>;
  }) {
    this.storageService = StorageService;
    this.localServerConverterService = LocalServerConverterService;
  }

  public static getInstance({
    StorageService,
    LocalServerConverterService,
  }: {
    StorageService: StorageServiceType;
    LocalServerConverterService: LocalServerConverterService<any, any>;
  }): DataManagerService {
    if (!DataManagerService.instance) {
      DataManagerService.instance = new DataManagerService({
        StorageService,
        LocalServerConverterService,
      });
    }
    return DataManagerService.instance;
  }

  public async initialize(): Promise<void> {
    await Promise.all([
      this.storageService.initialize(),
      this.localServerConverterService.initialize(),
    ]);
    return;
  }

  public async fetchTools(): Promise<Tool[]> {
    const tools = await this.storageService.getTools();
    return tools;
  }

  public async createTool(tool: NewTool): Promise<Tool> {
    const newTool: Tool = {
      ...tool,
      id: uuidv4(),
    };

    await this.storageService.addTool(newTool);
    return newTool;
  }
}

export default DataManagerService;
