// retry doesnt work

import Queue from "./Queue";

type Task = {
  action: () => Promise<void>;
  retry?: boolean;
  maxRetries?: number;
  dependencies: Task[];
};

const processTask = async (task: Task): Promise<void> => {
  console.log("Processing task");
  try {
    await task.action();
    for (const dependency of task.dependencies) {
      await processTask(dependency);
    }
  } catch (error) {
    throw error;
  }
};

class TaskQueue {
  private taskQueue = new Queue<{
    task: () => Promise<void>;
    retry: boolean | undefined;
    retriesLeft: number;
  }>();
  private isProcessingQueue = false;

  public async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    while (!this.taskQueue.isEmpty()) {
      const taskWrapper = this.taskQueue.dequeue();
      if (!taskWrapper) {
        continue;
      }
      const { task, retry, retriesLeft } = taskWrapper;
      try {
        await task();
      } catch (error) {
        if (retry && retriesLeft > 0) {
          this.taskQueue.enqueue({ task, retry, retriesLeft: retriesLeft - 1 });
        }
      }
    }

    this.isProcessingQueue = false;
  }

  public queueTask(task: Task): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const taskWrapper = async () => {
        try {
          await processTask(task);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      const retries =
        task.maxRetries !== undefined ? task.maxRetries : task.retry ? 1 : 0;
      this.taskQueue.enqueue({
        task: taskWrapper,
        retry: task.retry,
        retriesLeft: retries,
      });
      this.processQueue();
    });
  }
}

export default TaskQueue;
export type { Task };
