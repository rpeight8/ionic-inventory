import Queue from "./Queue";

type Task<R> = {
  action: () => Promise<R>;
  dependencies?: Task<void>[];
};

const processTask = async <R>(task: Task<R>): Promise<void> => {
  await task.action();
  if (!task.dependencies) {
    return;
  }
  for (const dependency of task.dependencies) {
    await processTask(dependency);
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

      await task();
    }

    this.isProcessingQueue = false;
  }

  public queueTask<R>(task: Task<R>, autoProcess: boolean = false): Promise<R> {
    const promise = new Promise<R>((resolve, reject) => {
      const taskWrapper = async () => {
        try {
          const res = await processTask(task);
          resolve(res as R);
        } catch (error) {
          reject(error);
          throw error;
        }
      };

      this.taskQueue.enqueue(taskWrapper);
    });

    if (autoProcess) {
      this.processQueue();
    }

    return promise;
  }

  public async processNextTask(): Promise<void> {
    const task = this.taskQueue.dequeue();
    if (task) {
      await task();
    }
  }

  public hasTasks(): boolean {
    return !this.taskQueue.isEmpty();
  }
}

export default TaskQueue;
export type { Task };
