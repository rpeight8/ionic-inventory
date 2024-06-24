import { describe, it, beforeEach, expect, vi } from "vitest";
import ActionScheduller from "./ActionSchedullerService";
import { Status, ROOT } from "./ActionSchedullerService";
import type { Node, Action } from "./ActionSchedullerService";

const createNode = (
  id: string,
  type: string,
  params = {},
  handler: (params: Record<string, any>) => Promise<void> = async () => {},
  statusType = Status.IDLE,
  statusText = "Initial status"
): Node<Action> => ({
  id,
  data: {
    type,
    params,
    handler,
    status: {
      type: statusType,
      text: statusText,
    },
  },
});

describe("ActionScheduller", () => {
  let scheduler: ActionScheduller;

  beforeEach(() => {
    scheduler = ActionScheduller.getInstance();
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
    const actionNode = createNode("1", "action", {}, async () => {});
    scheduler.addNode(actionNode);
    scheduler.addEdge(ROOT, "1");

    const performActionSpy = vi.spyOn(scheduler, "performAction");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode);
    expect(actionNode.data.status.type).toBe(Status.OK);
  });

  it("should wait if parent status is pending", async () => {
    const parentNode = createNode(
      "1",
      "action",
      {},
      async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 300);
        });
      },
      Status.PENDING
    );
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
    const parentNode = createNode(
      "1",
      "action",
      {},
      async () => {
        throw new Error("Parent failed");
      },
      Status.FAILED
    );
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
    const parentNode = createNode(
      "1",
      "action",
      {},
      async () => {
        throw new Error("Parent failed");
      },
      Status.FAILED
    );
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

    const performActionSpy = vi.spyOn(scheduler, "performAction");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenNthCalledWith(1, actionNode1);
    expect(performActionSpy).toHaveBeenNthCalledWith(2, actionNode2);
    expect(performActionSpy).toHaveBeenNthCalledWith(3, actionNode3);
  });

  it("should handle failed actions correctly", async () => {
    const actionNode = createNode("1", "action", {}, async () => {
      throw new Error("Action failed");
    });
    scheduler.addNode(actionNode);
    scheduler.addEdge(ROOT, "1");

    const performActionSpy = vi.spyOn(scheduler, "performAction");

    await scheduler.run();

    expect(performActionSpy).toHaveBeenCalledWith(actionNode);
    expect(actionNode.data.status.type).toBe(Status.FAILED);
    expect(actionNode.data.status.text).toBe("Action failed: Action failed");
  });
});
