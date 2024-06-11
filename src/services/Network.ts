import { Network as CapacitorNetwork } from "@capacitor/network";

type EventName = "networkStatusChange";

type Network = {
  addListener: (eventName: EventName, handler: () => void) => void;
  removeAllListeners: () => void;
  getStatus: () => Promise<{ connected: boolean }>;
};

const Network: Network = {
  addListener: CapacitorNetwork.addListener,
  removeAllListeners: CapacitorNetwork.removeAllListeners,
  getStatus: CapacitorNetwork.getStatus,
};

export { Network };
