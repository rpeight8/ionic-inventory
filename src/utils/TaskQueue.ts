import Queue from "./Queue";

type Task = {
  action: () => Promise<void>;
  dependencies: Task[];
};

const processTask = async (task: Task): Promise<void> => {
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
  private taskQueue = new Queue<() => Promise<void>>();
  private isProcessingQueue = false;

  public async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    while (!this.taskQueue.isEmpty()) {
      const task = this.taskQueue.dequeue();
      if (task) {
        await task();
      }
    }

    this.isProcessingQueue = false;
  }

  public queueTask(task: Task): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.taskQueue.enqueue(async () => {
        try {
          await processTask(task);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }
}

export default TaskQueue;
export type { Task };
