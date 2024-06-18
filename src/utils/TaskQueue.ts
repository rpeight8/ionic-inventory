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
      if (!task) {
        continue;
      }
      try {
        await task();
      } catch (error) {
        console.error("Task failed:", error);
        throw error;
      }
    }

    this.isProcessingQueue = false;
  }

  public queueTask(task: Task): Promise<unknown> {
    return new Promise<void>((resolve, reject) => {
      const taskWrapper = async () => {
        try {
          await processTask(task);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.taskQueue.enqueue(taskWrapper);
    });
  }

  public async processNextTask(): Promise<void> {
    const task = this.taskQueue.dequeue();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Task failed:", error);
        throw error;
      }
    }
  }

  public hasTasks(): boolean {
    return !this.taskQueue.isEmpty();
  }
}

export default TaskQueue;
export type { Task };
