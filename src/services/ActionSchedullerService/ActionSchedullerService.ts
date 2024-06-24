import DAG from "../../utils/DAG";
import type { Node } from "../../utils/DAG";

type Action = {
  type: string;
  params: Record<string, any>;
  handler: (params: Record<string, any>) => Promise<void>;
  status: StatusType;
};

type StatusType = {
  type: Status;
  text: string;
};

interface IActionScheduller {
  run(): Promise<void>;
  reset(): void;
}

const ROOT = "ROOT";
enum Status {
  OK = "ok",
  PENDING = "pending",
  IDLE = "idle",
  WAITING = "waiting",
  FAILED = "failed",
}

class ActionScheduller extends DAG<Action> implements IActionScheduller {
  private static instance: ActionScheduller;

  private constructor() {
    super();
    this.reset();
  }

  public static getInstance(): ActionScheduller {
    if (!ActionScheduller.instance) {
      ActionScheduller.instance = new ActionScheduller();
    }
    return ActionScheduller.instance;
  }

  async executeNode(node: Node<Action>): Promise<void> {
    const incomingEdges = this.getIncomingEdges(node.id);
    const parentNodes = incomingEdges
      .map((edge) => this.findNode(edge.from))
      .filter(Boolean) as Node<Action>[];

    const allParentsOk = parentNodes.every(
      (parent) => parent.data.status.type === Status.OK
    );
    const anyParentFailed = parentNodes.some(
      (parent) => parent.data.status.type === Status.FAILED
    );
    const anyParentPending = parentNodes.some(
      (parent) => parent.data.status.type === Status.PENDING
    );

    if (node.id !== ROOT && anyParentPending) {
      node.data.status = {
        type: Status.WAITING,
        text: "Waiting for parent tasks to complete",
      };
      return;
    }

    if (node.id !== ROOT && anyParentFailed) {
      node.data.status = {
        type: Status.FAILED,
        text: "Dependency error due to parent failure",
      };
      await this.failAllChildren(node);
      return;
    }

    try {
      if (node.data.type === ROOT) {
        await this.executeChildren(node);
      } else {
        node.data.status = {
          type: Status.PENDING,
          text: "Action is being executed",
        };
        await this.performAction(node);
        node.data.status = {
          type: Status.OK,
          text: "Action performed successfully",
        };
        await this.executeChildren(node);
      }
    } catch (error) {
      node.data.status = {
        type: Status.FAILED,
        text: `Action failed: ${(error as Error).message}`,
      };
      await this.failAllChildren(node);
    }
  }

  async executeChildren(node: Node<Action>): Promise<void> {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(Boolean) as Node<Action>[];
    await Promise.all(
      childNodes.map(async (child) => {
        await this.executeNode(child);
      })
    );
  }

  async failAllChildren(node: Node<Action>): Promise<void> {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(Boolean) as Node<Action>[];
    await Promise.all(
      childNodes.map(async (child) => {
        child.data.status = {
          type: Status.FAILED,
          text: "Dependency error due to parent failure",
        };
        await this.failAllChildren(child);
      })
    );
  }

  async performAction(node: Node<Action>): Promise<void> {
    return await node.data.handler(node.data.params);
  }

  async run(): Promise<void> {
    const rootNode = this.findNode(ROOT);
    if (rootNode) {
      await this.executeNode(rootNode);
    } else {
      throw new Error("Root node not found");
    }
  }

  public addNode(node: Node<Action>): void {
    if (!node.data.status.type) {
      node.data.status = {
        type: Status.IDLE,
        text: "Node is idle",
      };
    }
    super.addNode(node);
  }

  public reset(): void {
    this.nodes = [];
    this.edges = [];
    const rootNode: Node<Action> = {
      id: ROOT,
      data: {
        type: ROOT,
        params: {},
        handler: async () => {},
        status: { type: Status.OK, text: "Root node" },
      },
    };
    this.addNode(rootNode);
  }
}

export default ActionScheduller;
export { Status, ROOT };
export type { StatusType, Node, Action };
