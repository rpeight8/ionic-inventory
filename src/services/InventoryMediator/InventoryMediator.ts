import LocalServerConverterService from "../LocalServerConverterService";
import StorageService from "../StorageService";
import ActionHandlersService from "../ActionHandlersService/ActionHandlersService";
import ActionSchedulerService from "../ActionSchedulerService/ActionSchedulerService";
import type { ActionSchedulerType } from "../ActionSchedulerService/ActionSchedulerService";
import HttpClientService from "../HttpClientService/HttpClientService";
import type { HttpClientError } from "../HttpClientService/HttpClientService";
import ActionManagerService, {
  ActionManagerServiceType,
} from "../ActionManagerService/ActionManagerService";
import { ActionsUnion, Tool } from "../../types";
import NetworkStatusService from "../NetworkStatusService";
import type { ServiceNetworkStatus } from "../NetworkStatusService";

const storageService = StorageService.getInstance();
const localServerConverterService =
  LocalServerConverterService.getInstance(storageService);
const httpClientService = new HttpClientService("http://localhost:3000");
const actionHandlersService = new ActionHandlersService({
  HTTPClientService: httpClientService,
  LocalServerConverterService: localServerConverterService,
});
const actionSchedulerService = ActionSchedulerService.getInstance<ActionsUnion>(
  actionHandlersService
);
const actionManagerService = new ActionManagerService(actionSchedulerService);

type InventoryMediatorType = {
  initialize(): Promise<void>;
  getTools(): Promise<Tool[]>;
  getNetworkStatus(): ReturnType<typeof NetworkStatusService.getStatus>;
};

class InventoryMediatorService implements InventoryMediatorType {
  private static instance: InventoryMediatorService;
  private initialized = false;
  private actionScheduler: ActionSchedulerType<ActionsUnion>;
  private actionManager: ActionManagerServiceType;
  private constructor(
    actionScheduler: ActionSchedulerType<ActionsUnion>,
    actionManager: ActionManagerServiceType
  ) {
    this.actionScheduler = actionScheduler;
    this.actionManager = actionManager;
  }

  public static getInstance(
    actionScheduler: ActionSchedulerType<ActionsUnion>,
    actionManager: ActionManagerServiceType
  ): InventoryMediatorService {
    if (!InventoryMediatorService.instance) {
      InventoryMediatorService.instance = new InventoryMediatorService(
        actionScheduler,
        actionManager
      );
    }
    return InventoryMediatorService.instance as InventoryMediatorService;
  }

  public async initialize(): Promise<void> {
    try {
      if (this.initialized) return;

      await Promise.all([this.actionScheduler.initialize()]);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize InventoryMediator", error);
      throw new Error("Failed to initialize InventoryMediator");
    }
  }

  public async getTools(): Promise<Tool[]> {
    const tools = await this.actionManager.getTools();

    if (tools[1]) {
      tools[1];
    }
  }

  public async getNetworkStatus() {
    return NetworkStatusService.getStatus();
  }
}

const mediator = InventoryMediatorService.getInstance(
  actionSchedulerService,
  actionManagerService
);

export default InventoryMediatorService;
export type { InventoryMediatorType };
