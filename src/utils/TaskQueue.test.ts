import { describe, it, expect, beforeEach, vi } from "vitest";
import TaskQueue, { Task } from "./TaskQueue";

describe("TaskQueue", () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  it("should enqueue and process a single task", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const task: Task = { action, dependencies: [] };

    taskQueue.queueTask(task);
    expect(taskQueue.hasTasks()).toBe(true);
    await taskQueue.processQueue();

    expect(action).toHaveBeenCalled();
    expect(taskQueue.hasTasks()).toBe(false);
  });

  it("should process tasks in the order they were enqueued", async () => {
    const results: number[] = [];
    const task1: Task = {
      action: async () => {
        results.push(1);
      },
      dependencies: [],
    };
    const task2: Task = {
      action: async () => {
        results.push(2);
      },
      dependencies: [],
    };

    taskQueue.queueTask(task1);
    taskQueue.queueTask(task2);
    await taskQueue.processQueue();

    expect(results).toEqual([1, 2]);
  });

  it("should process dependencies after the main task", async () => {
    const results: number[] = [];
    const dependencyOfDependency: Task = {
      action: async () => {
        results.push(3);
      },
      dependencies: [],
    };
    const dependency: Task = {
      action: async () => {
        results.push(2);
      },
      dependencies: [dependencyOfDependency],
    };
    const dependency1: Task = {
      action: async () => {
        results.push(1.5);
      },
      dependencies: [],
    };
    const task: Task = {
      action: async () => {
        results.push(1);
      },
      dependencies: [dependency1, dependency],
    };

    taskQueue.queueTask(task);
    await taskQueue.processQueue();
    expect(results).toEqual([1, 1.5, 2, 3]);
  });

  it("should handle errors in task execution", async () => {
    const error = new Error("Test error");
    const task: Task = {
      action: vi.fn().mockRejectedValue(error),
      dependencies: [],
    };

    const queueRes = taskQueue.queueTask(task);
    await expect(taskQueue.processQueue()).resolves.not.toThrow();
    await expect(queueRes).rejects.toThrow(error);
  });

  it("should not process dependencies if the main task fails", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Test error"));
    const dependencyAction = vi.fn().mockResolvedValue(undefined);
    const dependency: Task = { action: dependencyAction, dependencies: [] };
    const task: Task = { action, dependencies: [dependency] };

    const queueRes = taskQueue.queueTask(task);
    try {
      await taskQueue.processQueue();
    } catch (error) {
      // Catching and logging the error for better debugging
      console.error("Error caught during task processing:", error);
    }
    await expect(queueRes).rejects.toThrow();
    expect(action).toHaveBeenCalled();
    expect(dependencyAction).not.toHaveBeenCalled();
  });

  it("should allow processing tasks one by one", async () => {
    const results: number[] = [];
    const task1: Task = {
      action: async () => {
        results.push(1);
      },
      dependencies: [],
    };
    const task2: Task = {
      action: async () => {
        results.push(2);
      },
      dependencies: [],
    };

    taskQueue.queueTask(task1);
    taskQueue.queueTask(task2);

    await taskQueue.processNextTask();
    expect(results).toEqual([1]);

    await taskQueue.processNextTask();
    expect(results).toEqual([1, 2]);
  });

  it("should indicate whether there are tasks in the queue", async () => {
    const task: Task = { action: async () => {}, dependencies: [] };

    taskQueue.queueTask(task);
    expect(taskQueue.hasTasks()).toBe(true);

    await taskQueue.processNextTask();
    expect(taskQueue.hasTasks()).toBe(false);
  });

  it("should not throw an error if there are no tasks to process", async () => {
    await expect(taskQueue.processNextTask()).resolves.not.toThrow();
  });

  it("should not process any tasks if the queue is empty", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const task: Task = { action, dependencies: [] };

    taskQueue.queueTask(task);
    await taskQueue.processNextTask();
    await taskQueue.processNextTask(); // Process next task when queue is already empty

    expect(action).toHaveBeenCalledTimes(1); // Should be called only once
    expect(taskQueue.hasTasks()).toBe(false);
  });
});
