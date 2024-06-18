import NetworkStatusService from "./NetworkStatusService";
import TaskQueue from "../utils/TaskQueue";
import type { Task } from "../utils/TaskQueue";

const queue = new TaskQueue();

type SyncService = {
  sync: () => Promise<unknown>;
  queueTask: (task: Task) => Promise<unknown>;
};

NetworkStatusService.addListener("networkStatusChange", async () => {
  if ((await NetworkStatusService.getStatus()).connected) {
    await SyncService.sync();
  }
});

const SyncService: SyncService = {
  sync: async () => {
    if (!(await NetworkStatusService.getStatus()).connected) {
      return;
    }
    while (queue.hasTasks()) {
      try {
        await queue.processNextTask();
      } catch (error) {
        console.error("Error processing task during sync:", error);
        console.log(error);
      }
    }
  },
  queueTask: async (action: Task) => {
    return await queue.queueTask(action);
  },
};

export default SyncService;
