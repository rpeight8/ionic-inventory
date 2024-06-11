import { Network as CapacitorNetwork } from "@capacitor/network";
import HttpClient from "./HttpClient";

type EventName = "networkStatusChange";

type NetworkStatusService = {
  addListener: (eventName: EventName, handler: () => void) => void;
  removeAllListeners: () => void;
  getStatus: () => Promise<{ connected: boolean }>;
};

const NetworkStatusService: NetworkStatusService = {
  addListener: CapacitorNetwork.addListener,
  removeAllListeners: CapacitorNetwork.removeAllListeners,
  getStatus: async () => {
    try {
      const status = await CapacitorNetwork.getStatus();
      if (status.connected) {
        const resp = await HttpClient.get<string>("https://www.google.com");
        return { connected: true };
      }

      return { connected: false };
    } catch (error) {
      return { connected: false };
    }
  },
};

export default NetworkStatusService;
export type { NetworkStatusService };
