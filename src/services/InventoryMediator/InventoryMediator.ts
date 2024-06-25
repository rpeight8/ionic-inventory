import LocalServerConverterService from "../LocalServerConverterService";
import StorageService from "../StorageService";
import ActionHandlersService from "../ActionHandlersService/ActionHandlersService";
import ActionSchedulerService from "../ActionSchedulerService/ActionSchedulerService";
import type { ActionSchedulerType } from "../ActionSchedulerService/ActionSchedulerService";
import HttpClientService from "../HttpClientService/HttpClientService";

const storageService = StorageService.getInstance();
const localServerConverterService =
  LocalServerConverterService.getInstance(storageService);
const httpClientService = new HttpClientService("http://localhost:3000");
const actionHandlersService = new ActionHandlersService({
  HTTPClientService: httpClientService,
  LocalServerConverterService: localServerConverterService,
});
const actionSchedulerService = ActionSchedulerService.getInstance(
  actionHandlersService
);

type InventoryMediatorType = {
  initialize(): Promise<void>;
};

class InventoryMediatorService implements InventoryMediatorType {
  private static instance: InventoryMediatorService;
  private initialized = false;
  private actionScheduler: ActionSchedulerType;
  private constructor(actionScheduler: ActionSchedulerType) {
    this.actionScheduler = actionScheduler;
  }

  public static getInstance(
    actionScheduler: ActionSchedulerType
  ): InventoryMediatorService {
    if (!InventoryMediatorService.instance) {
      InventoryMediatorService.instance = new InventoryMediatorService(
        actionScheduler
      );
    }
    return InventoryMediatorService.instance as InventoryMediatorService;
  }

  public async initialize(): Promise<void> {
    try {
      await Promise.all([this.actionScheduler.initialize()]);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize InventoryMediator", error);
      throw new Error("Failed to initialize InventoryMediator");
    }
  }
}

export default InventoryMediatorService;
export type { InventoryMediatorType };
