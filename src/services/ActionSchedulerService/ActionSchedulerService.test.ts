// @ts-nocheck
// TODO: Fix tests

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import ActionSchedulerService from "./ActionSchedulerService";
import { Status, RootNodeId } from "./ActionSchedulerService";
import type { Node, Action, Handlers } from "./ActionSchedulerService";

const createNode = (
  id: string,
  type: string,
  payload = {},
  statusType = Status.IDLE,
  statusText = "Initial status"
): Node<Action> => ({
  id,
  data: {
    type,
    payload,
    status: {
      type: statusType,
      text: statusText,
    },
  },
});

// Mock handlers
const handlers: Handlers = {
  async action(payload: Record<string, any>) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Action completed");
      }, 200);
    });
  },
  async fail(payload: Record<string, any>) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Action failed"));
      }, 200);
    });
  },
};

describe("ActionSchedulerService", () => {
  let scheduler: ActionSchedulerService<any>;

  beforeEach(async () => {
    scheduler = ActionSchedulerService.getInstance(handlers);
    await scheduler.initialize();
    scheduler.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with a root node", () => {
    const rootNode = scheduler.findNode(RootNodeId);
    expect(rootNode).toBeDefined();
    expect(rootNode?.data.type).toBe(RootNodeId);
    expect(rootNode?.data.status.type).toBe(Status.OK);
  });

  it("should add nodes with IDLE status by default", () => {
    const actionNode = createNode("1", "action");
    scheduler.addNodeOverride(actionNode);

    expect(actionNode.data.status.type).toBe(Status.IDLE);
  });

  it("should perform actions for nodes without dependencies", async () => {
    const actionNode = createNode("1", "action");
    scheduler.addNodeOverride(actionNode);
    scheduler.addEdge(RootNodeId, "1");

    const performActionSpy = vi.spyOn(handlers, "action");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode.data.payload);
    expect(actionNode.data.status.type).toBe(Status.OK);
  });

  it("should wait if parent status is pending", async () => {
    const parentNode = createNode("1", "action");
    const childNode = createNode("2", "action");
    scheduler.addNodeOverride(parentNode);
    scheduler.addNodeOverride(childNode);
    scheduler.addEdge(RootNodeId, "1");
    scheduler.addEdge("1", "2");

    const promise = scheduler.run();

    expect(childNode.data.status.type).toBe(Status.WAITING);
    await promise;
    expect(childNode.data.status.type).toBe(Status.OK);
  });

  it("should propagate failures through multiple levels", async () => {
    const parentNode = createNode("1", "fail");
    const childNode1 = createNode("2", "action");
    const childNode2 = createNode("3", "action");
    const grandChildNode = createNode("4", "action");
    const promise1 = scheduler.addNodeOverride(parentNode);
    const promise2 = scheduler.addNodeOverride(childNode1);
    const promise3 = scheduler.addNodeOverride(childNode2);
    const promise4 = scheduler.addNodeOverride(grandChildNode);
    scheduler.addEdge(RootNodeId, "1");
    scheduler.addEdge("1", "2");
    scheduler.addEdge("1", "3");
    scheduler.addEdge("2", "4");

    await scheduler.run();
    await expect(promise1[0]).rejects.toThrow("Action failed");
    await expect(promise2[0]).rejects.toThrow("Action failed");
    await expect(promise3[0]).rejects.toThrow("Action failed");
    await expect(promise4[0]).rejects.toThrow("Action failed");
    expect(parentNode.data.status.type).toBe(Status.FAILED);
    expect(childNode1.data.status.type).toBe(Status.FAILED);
    expect(childNode2.data.status.type).toBe(Status.FAILED);
    expect(grandChildNode.data.status.type).toBe(Status.FAILED);
  });

  it("should execute actions in the correct order", async () => {
    const rootNode = scheduler.findNode(RootNodeId)!;
    const actionNode1 = createNode("1", "action");
    const actionNode2 = createNode("2", "action");
    const actionNode3 = createNode("3", "action");

    scheduler.addNodeOverride(actionNode1);
    scheduler.addNodeOverride(actionNode2);
    scheduler.addNodeOverride(actionNode3);

    scheduler.addEdge(rootNode.id, actionNode1.id);
    scheduler.addEdge(actionNode1.id, actionNode2.id);
    scheduler.addEdge(actionNode2.id, actionNode3.id);

    const performActionSpy = vi.spyOn(handlers, "action");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenNthCalledWith(
      1,
      actionNode1.data.payload
    );
    expect(performActionSpy).toHaveBeenNthCalledWith(
      2,
      actionNode2.data.payload
    );
    expect(performActionSpy).toHaveBeenNthCalledWith(
      3,
      actionNode3.data.payload
    );
  });

  it("should handle failed actions correctly", async () => {
    const actionNode = createNode("1", "fail");
    scheduler.addNodeOverride(actionNode);
    scheduler.addEdge(RootNodeId, "1");

    const performActionSpy = vi.spyOn(handlers, "fail");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode.data.payload);
    expect(actionNode.data.status.type).toBe(Status.FAILED);
  });
});

describe("ActionSchedulerService Serialization", () => {
  let scheduler: ActionSchedulerService<any>;

  beforeEach(() => {
    scheduler = ActionSchedulerService.getInstance(handlers);
    scheduler.reset();
  });

  it("should serialize and deserialize correctly", () => {
    const actionNode = createNode("1", "action");
    scheduler.addNodeOverride(actionNode);
    scheduler.addEdge(RootNodeId, "1");

    const serialized = scheduler.serialize();
    scheduler.reset();
    scheduler.deserialize(serialized);

    const deserializedNode = scheduler.findNode("1");
    expect(deserializedNode).toBeDefined();
    expect(deserializedNode?.data.status.type).toBe(Status.IDLE);
    expect(deserializedNode?.data.type).toBe("action");
  });

  it("should maintain correct edges after deserialization", () => {
    const actionNode1 = createNode("1", "action");
    const actionNode2 = createNode("2", "action");
    scheduler.addNodeOverride(actionNode1);
    scheduler.addNodeOverride(actionNode2);
    scheduler.addEdge(RootNodeId, "1");
    scheduler.addEdge("1", "2");

    const serialized = scheduler.serialize();
    scheduler.reset();
    scheduler.deserialize(serialized);

    const edges = scheduler.edges;
    expect(edges).toContainEqual({ from: RootNodeId, to: "1" });
    expect(edges).toContainEqual({ from: "1", to: "2" });
  });

  it("should restore handlers correctly after deserialization", async () => {
    const actionNode = createNode("1", "action");
    scheduler.addNodeOverride(actionNode);
    scheduler.addEdge(RootNodeId, "1");

    const serialized = scheduler.serialize();
    scheduler.reset();
    scheduler.deserialize(serialized);

    // Manually reassign handlers after deserialization
    scheduler["handlers"] = handlers;

    const performActionSpy = vi.spyOn(handlers, "action");
    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode.data.payload);
  });
});

describe("ActionSchedulerService addNodeOverride Promise Handling", () => {
  let scheduler: ActionSchedulerService<any>;

  beforeEach(async () => {
    scheduler = ActionSchedulerService.getInstance(handlers);
    await scheduler.initialize();
    scheduler.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve the promise when action completes successfully", async () => {
    const actionNode = createNode("1", "action");
    const [promise] = scheduler.addNodeOverride(actionNode);
    scheduler.addEdge(RootNodeId, "1");

    await scheduler.run();

    await expect(promise).resolves.toBe("Action completed");
    expect(actionNode.data.status.type).toBe(Status.OK);
  });

  it("should reject the promise when action fails", async () => {
    const actionNode = createNode("1", "fail");
    const [promise] = scheduler.addNodeOverride(actionNode);
    scheduler.addEdge(RootNodeId, "1");

    await scheduler.run();

    await expect(promise).rejects.toThrow("Action failed");
    expect(actionNode.data.status.type).toBe(Status.FAILED);
  });

  it("should resolve promises for dependent nodes in the correct order", async () => {
    const actionNode1 = createNode("1", "action");
    const actionNode2 = createNode("2", "action");
    const [promise1] = scheduler.addNodeOverride(actionNode1);
    const [promise2] = scheduler.addNodeOverride(actionNode2);
    scheduler.addEdge(RootNodeId, "1");
    scheduler.addEdge("1", "2");

    await scheduler.run();
    await expect(promise1).resolves.toBe("Action completed");
    await expect(promise2).resolves.toBe("Action completed");
    expect(actionNode1.data.status.type).toBe(Status.OK);
    expect(actionNode2.data.status.type).toBe(Status.OK);
  });

  it("should handle promises for multiple nodes correctly", async () => {
    const actionNode1 = createNode("1", "action");
    const actionNode2 = createNode("2", "action");
    const actionNode3 = createNode("3", "fail");
    const [promise1] = scheduler.addNodeOverride(actionNode1);
    const [promise2] = scheduler.addNodeOverride(actionNode2);
    const [promise3] = scheduler.addNodeOverride(actionNode3).catch(() => {});
    scheduler.addEdge(RootNodeId, "1");
    scheduler.addEdge("1", "2");
    scheduler.addEdge("2", "3");

    await scheduler.run();

    await expect(promise1).resolves.toBe("Action completed");
    await expect(promise2).resolves.toBe("Action completed");
    await expect(promise3).rejects.toThrow("Action failed");

    expect(actionNode1.data.status.type).toBe(Status.OK);
    expect(actionNode2.data.status.type).toBe(Status.OK);
    expect(actionNode3.data.status.type).toBe(Status.FAILED);
  });
});
