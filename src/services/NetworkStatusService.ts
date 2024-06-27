import { Network as CapacitorNetwork, Network } from "@capacitor/network";
import HttpClientService, {
  NetworkConnectionError,
  UnhandledError,
  BasicError,
  HttpClientType,
} from "./HttpClientService/HttpClientService";

enum EventName {
  networkStatusChange = "networkStatusChange",
}

type StatusUpdateError = NetworkConnectionError | BasicError | UnhandledError;

type EventNameUnion = `${EventName}`;

type ServiceNetworkStatus = {
  connected: boolean;
  lastChecked: number;
};
type ProviderNetworkStatus = {
  connected: boolean;
};

const HttpClient: HttpClientType = new HttpClientService();

// Interface for the imported network module
type NetworkServiceProvider = {
  getStatus: () => Promise<ProviderNetworkStatus>;
  addListener: (
    eventName: EventNameUnion,
    handler: (status: ProviderNetworkStatus) => void
  ) => void;
  removeAllListeners: () => void;
};

type NetworkStatusService = {
  addListener: (
    eventName: EventNameUnion,
    handler: (status: ServiceNetworkStatus) => void
  ) => void;
  removeListener: (
    eventName: EventNameUnion,
    handler: (status: ServiceNetworkStatus) => void
  ) => void;
  removeAllListeners: () => void;
  getStatus: (invalidateCache?: boolean) => Promise<ServiceNetworkStatus>;
};

const NetworkServiceProvider: NetworkServiceProvider = CapacitorNetwork;

const PING_INTERVAL = 60000; // 1 minute
let cachedStatus: ServiceNetworkStatus | undefined = undefined;
const internalNetworkStatusChangeListeners = new Set<
  (status: ServiceNetworkStatus) => void
>();

const networkStatusChangeListener = async ({
  connected,
}: ProviderNetworkStatus) => {
  const err = await updateNetworkStatus();

  if (!cachedStatus) {
    console.error(
      "networkStatusChangeListener: Failed to validate network status"
    );
    return;
  }

  for (const listener of internalNetworkStatusChangeListeners) {
    listener(cachedStatus);
  }
};

const addListenerInternal = async (
  eventName: EventNameUnion,
  handler: (status: ServiceNetworkStatus) => void
) => {
  if (eventName === EventName["networkStatusChange"]) {
    // TODO: Check for already fired event when adding listener
    internalNetworkStatusChangeListeners.add(handler);
  }
};

const removeListenerInternal = async (
  eventName: EventNameUnion,
  handler: (status: ServiceNetworkStatus) => void
) => {
  if (eventName === EventName["networkStatusChange"]) {
    internalNetworkStatusChangeListeners.delete(handler);
  }
};

const removeAllListenersInternal = () => {
  internalNetworkStatusChangeListeners.clear();
};

const updateNetworkStatus = async (): Promise<
  StatusUpdateError | undefined
> => {
  try {
    const status = await NetworkServiceProvider.getStatus();
    if (status.connected) {
      const [, err] = await HttpClient.ping("", {});
      if (err) {
        throw new Error("Failed to ping");
      }
    }

    let currentTime = Date.now();
    cachedStatus = { connected: status.connected, lastChecked: currentTime };
  } catch (error) {
    console.error(error);
    if (error instanceof NetworkConnectionError) {
      console.log(
        "Network Status Update: Failed to ping because of network (probably)"
      );
      return error;
    }

    if (error instanceof BasicError) {
      console.log(
        "Network Status Update: Failed to ping because of some side errors"
      );
      return error;
    }

    if (error instanceof UnhandledError) {
      console.log(
        "Network Status Update: Failed to ping because of unknown error"
      );
      return error;
    }

    // TODO: Fix `as`
    return error as Error;
  }
};

NetworkServiceProvider.addListener(
  EventName["networkStatusChange"],
  networkStatusChangeListener
);

const NetworkStatusService: NetworkStatusService = {
  addListener: addListenerInternal,
  removeListener: removeListenerInternal,
  removeAllListeners: removeAllListenersInternal,
  getStatus: async (invalidateCache = false): Promise<ServiceNetworkStatus> => {
    let currentTime = Date.now();

    if (
      !invalidateCache &&
      cachedStatus &&
      currentTime - cachedStatus.lastChecked < PING_INTERVAL
    ) {
      return { connected: cachedStatus.connected, lastChecked: currentTime };
    }

    try {
      await updateNetworkStatus();
      if (!cachedStatus) {
        throw new Error("Failed to fetch network status");
      }

      return cachedStatus;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch network status");
    }
  },
};

export default NetworkStatusService;
export type { NetworkStatusService, ServiceNetworkStatus };
