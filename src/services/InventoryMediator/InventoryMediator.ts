import LocalServerConverterService from "../LocalServerConverterService";
import StorageService from "../StorageService";
import ActionHandlersService from "../ActionHandlersService/ActionHandlersService";
import DataManagerService from "../DataManagerService";
import ActionScheduler from "../ActionSchedulerService/ActionSchedulerService";
import HttpClientService from "../HttpClientService/HttpClientService";

const storageService = StorageService;
const localServerConverterService =
  LocalServerConverterService.getInstance(storageService);
const HttpClient = HttpClientService;
const actionHandlersService = new ActionHandlersService({
  HTTPClientService: HttpClient,
  LocalServerConverterService: localServerConverterService,
});
const actionScheduler = ActionScheduler.getInstance(actionHandlersService);
