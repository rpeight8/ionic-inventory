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
    const dependecyOfDependency: Task = {
      action: async () => {
        results.push(3);
      },
      dependencies: [],
    };
    const dependency: Task = {
      action: async () => {
        results.push(2);
      },
      dependencies: [dependecyOfDependency],
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
    console.log(results);
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
