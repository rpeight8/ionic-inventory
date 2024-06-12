import { Network as CapacitorNetwork } from "@capacitor/network";
import HttpClient from "./HttpClientService";

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
        await HttpClient.post<string>(
          "http://localhost:3000/utils/ping",
          undefined,
          {}
        );
      }

      return status;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch network status");
    }
  },
};

export default NetworkStatusService;
export type { NetworkStatusService };
