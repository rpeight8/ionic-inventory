import { describe, it, beforeEach, expect, vi } from "vitest";
import ActionScheduler from "./ActionSchedulerService";
import { Status, ROOT } from "./ActionSchedulerService";
import type { Node, Action, Handlers } from "./ActionSchedulerService";

const createNode = (
  id: string,
  type: string,
  params = {},
  statusType = Status.IDLE,
  statusText = "Initial status"
): Node<Action> => ({
  id,
  data: {
    type,
    params,
    status: {
      type: statusType,
      text: statusText,
    },
  },
});

// Mock handlers
const handlers: Handlers = {
  async action(params: Record<string, any>) {
    return;
  },
  async fail(params: Record<string, any>) {
    throw new Error("Action failed");
  },
};

describe("ActionScheduler", () => {
  let scheduler: ActionScheduler;

  beforeEach(() => {
    scheduler = ActionScheduler.getInstance(handlers);
    scheduler.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with a root node", () => {
    const rootNode = scheduler.findNode(ROOT);
    expect(rootNode).toBeDefined();
    expect(rootNode?.data.type).toBe(ROOT);
    expect(rootNode?.data.status.type).toBe(Status.OK);
  });

  it("should add nodes with IDLE status by default", () => {
    const actionNode = createNode("1", "action");
    scheduler.addNode(actionNode);

    expect(actionNode.data.status.type).toBe(Status.IDLE);
    expect(actionNode.data.status.text).toBe("Initial status");
  });

  it("should perform actions for nodes without dependencies", async () => {
    const actionNode = createNode("1", "action");
    scheduler.addNode(actionNode);
    scheduler.addEdge(ROOT, "1");

    const performActionSpy = vi.spyOn(handlers, "action");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode.data.params);
    expect(actionNode.data.status.type).toBe(Status.OK);
  });

  it("should wait if parent status is pending", async () => {
    const parentNode = createNode("1", "action", {}, Status.PENDING);
    const childNode = createNode("2", "action");
    scheduler.addNode(parentNode);
    scheduler.addNode(childNode);
    scheduler.addEdge(ROOT, "1");
    scheduler.addEdge("1", "2");

    scheduler.run();
    setTimeout(() => {
      expect(childNode.data.status.type).toBe(Status.WAITING);
      expect(childNode.data.status.text).toBe(
        "Waiting for parent tasks to complete"
      );
    }, 100);
  });

  it("should fail children if a parent fails", async () => {
    const parentNode = createNode("1", "fail", {}, Status.FAILED);
    const childNode1 = createNode("2", "action");
    const childNode2 = createNode("3", "action");
    scheduler.addNode(parentNode);
    scheduler.addNode(childNode1);
    scheduler.addNode(childNode2);
    scheduler.addEdge(ROOT, "1");
    scheduler.addEdge("1", "2");
    scheduler.addEdge("1", "3");

    await scheduler.run();

    expect(childNode1.data.status.type).toBe(Status.FAILED);
    expect(childNode1.data.status.text).toBe(
      "Dependency error due to parent failure"
    );
    expect(childNode2.data.status.type).toBe(Status.FAILED);
    expect(childNode2.data.status.text).toBe(
      "Dependency error due to parent failure"
    );
  });

  it("should propagate failures through multiple levels", async () => {
    const parentNode = createNode("1", "fail", {}, Status.FAILED);
    const childNode1 = createNode("2", "action");
    const childNode2 = createNode("3", "action");
    const grandChildNode = createNode("4", "action");
    scheduler.addNode(parentNode);
    scheduler.addNode(childNode1);
    scheduler.addNode(childNode2);
    scheduler.addNode(grandChildNode);
    scheduler.addEdge(ROOT, "1");
    scheduler.addEdge("1", "2");
    scheduler.addEdge("1", "3");
    scheduler.addEdge("2", "4");

    await scheduler.run();

    expect(childNode1.data.status.type).toBe(Status.FAILED);
    expect(childNode1.data.status.text).toBe(
      "Dependency error due to parent failure"
    );
    expect(childNode2.data.status.type).toBe(Status.FAILED);
    expect(childNode2.data.status.text).toBe(
      "Dependency error due to parent failure"
    );
    expect(grandChildNode.data.status.type).toBe(Status.FAILED);
    expect(grandChildNode.data.status.text).toBe(
      "Dependency error due to parent failure"
    );
  });

  it("should execute actions in the correct order", async () => {
    const rootNode = scheduler.findNode(ROOT)!;
    const actionNode1 = createNode("1", "action");
    const actionNode2 = createNode("2", "action");
    const actionNode3 = createNode("3", "action");

    scheduler.addNode(actionNode1);
    scheduler.addNode(actionNode2);
    scheduler.addNode(actionNode3);

    scheduler.addEdge(rootNode.id, actionNode1.id);
    scheduler.addEdge(actionNode1.id, actionNode2.id);
    scheduler.addEdge(actionNode2.id, actionNode3.id);

    const performActionSpy = vi.spyOn(handlers, "action");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenNthCalledWith(
      1,
      actionNode1.data.params
    );
    expect(performActionSpy).toHaveBeenNthCalledWith(
      2,
      actionNode2.data.params
    );
    expect(performActionSpy).toHaveBeenNthCalledWith(
      3,
      actionNode3.data.params
    );
  });

  it("should handle failed actions correctly", async () => {
    const actionNode = createNode("1", "fail");
    scheduler.addNode(actionNode);
    scheduler.addEdge(ROOT, "1");

    const performActionSpy = vi.spyOn(handlers, "fail");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode.data.params);
    expect(actionNode.data.status.type).toBe(Status.FAILED);
    expect(actionNode.data.status.text).toBe("Action failed: Action failed");
  });
});

describe("ActionScheduler Serialization", () => {
  let scheduler: ActionScheduler;

  beforeEach(() => {
    scheduler = ActionScheduler.getInstance(handlers);
    scheduler.reset();
  });

  it("should serialize and deserialize correctly", () => {
    const actionNode = createNode("1", "action");
    scheduler.addNode(actionNode);
    scheduler.addEdge(ROOT, "1");

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
    scheduler.addNode(actionNode1);
    scheduler.addNode(actionNode2);
    scheduler.addEdge(ROOT, "1");
    scheduler.addEdge("1", "2");

    const serialized = scheduler.serialize();
    console.log(serialized);
    scheduler.reset();
    scheduler.deserialize(serialized);

    const edges = scheduler.edges;
    expect(edges).toContainEqual({ from: ROOT, to: "1" });
    expect(edges).toContainEqual({ from: "1", to: "2" });
  });

  it("should restore handlers correctly after deserialization", () => {
    const actionNode = createNode("1", "action");
    scheduler.addNode(actionNode);
    scheduler.addEdge(ROOT, "1");

    const serialized = scheduler.serialize();
    scheduler.reset();
    scheduler.deserialize(serialized);

    scheduler.handlers = handlers; // Reassign handlers after deserialization

    const performActionSpy = vi.spyOn(handlers, "action");
    scheduler.run();

    setTimeout(() => {
      expect(performActionSpy).toHaveBeenCalledWith(actionNode.data.params);
    }, 100);
  });
});
