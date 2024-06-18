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

    await taskQueue.queueTask(task);
    await taskQueue.processQueue();

    expect(action).toHaveBeenCalled();
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

    await taskQueue.queueTask(task1);
    await taskQueue.queueTask(task2);
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

    await taskQueue.queueTask(task);
    await taskQueue.processQueue();
    expect(results).toEqual([1, 1.5, 2, 3]);
  });

  it("should handle errors in task execution", async () => {
    const error = new Error("Test error");
    const task: Task = {
      action: vi.fn().mockRejectedValue(error),
      dependencies: [],
    };

    await expect(taskQueue.queueTask(task)).rejects.toThrow("Test error");
  });

  it("should not process dependencies if the main task fails", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Test error"));
    const dependencyAction = vi.fn().mockResolvedValue(undefined);
    const dependency: Task = { action: dependencyAction, dependencies: [] };
    const task: Task = { action, dependencies: [dependency] };

    await expect(taskQueue.queueTask(task)).rejects.toThrow("Test error");
    await taskQueue.processQueue();

    expect(action).toHaveBeenCalled();
    expect(dependencyAction).not.toHaveBeenCalled();
  });

  it("should retry a task if it fails and has retry set to true with default retries", async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error("Test error"))
      .mockResolvedValueOnce(undefined);
    const task: Task = { action, retry: true, dependencies: [] };

    await taskQueue.queueTask(task);
    await taskQueue.processQueue();

    expect(action).toHaveBeenCalledTimes(2); // Should be called twice due to retry
  });

  it("should retry a task if it fails and has a specific number of retries set", async () => {
    const action = vi
      .fn()
      .mockRejectedValue(new Error("Test error"))
      .mockResolvedValueOnce(undefined);
    const task: Task = { action, retry: true, maxRetries: 2, dependencies: [] };

    await taskQueue.queueTask(task);
    await taskQueue.processQueue();

    expect(action).toHaveBeenCalledTimes(3); // Should be called three times (1 original + 2 retries)
  });

  it("should not retry a task if it fails and has retry set to false", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Test error"));
    const task: Task = { action, retry: false, dependencies: [] };

    await expect(taskQueue.queueTask(task)).rejects.toThrow("Test error");
    await taskQueue.processQueue();

    expect(action).toHaveBeenCalledTimes(1); // Should be called once and not retried
  });

  it("should process tasks concurrently", async () => {
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

    await Promise.all([taskQueue.queueTask(task1), taskQueue.queueTask(task2)]);
    await taskQueue.processQueue();

    expect(results).toEqual([1, 2]);
  });
});
