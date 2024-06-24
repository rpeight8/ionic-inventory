import { Actions } from "../../types";
import DAG from "../../utils/DAG";
import type { Node } from "../../utils/DAG";

type Params<T> = T extends (...args: infer P) => any ? P : never;

type Action<T> =
  | {
      [K in keyof T]: T[K] extends (...args: any) => any
        ? {
            type: K;
            params: Params<T[K]>;
            status: StatusType;
          }
        : never;
    }[keyof T]
  | {
      type: typeof ROOT;
      params: {};
      status: StatusType;
    };

type StatusType = {
  type: Status;
  text: string;
};

type Handlers<T> = {
  [K in keyof T]: (...params: Params<T[K]>) => Promise<void>;
};

interface IActionScheduler<T> {
  serialize(): string;
  deserialize(json: string): void;
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

class ActionScheduler<T> extends DAG<Action<T>> implements IActionScheduler<T> {
  private static instance: ActionScheduler<any>;
  private handlers: Handlers<T>;

  private constructor(handlers: Handlers<T>) {
    super();
    this.handlers = handlers;
    this.reset();
  }

  public static getInstance<T>(handlers: Handlers<T>): ActionScheduler<T> {
    if (!ActionScheduler.instance) {
      ActionScheduler.instance = new ActionScheduler<T>(handlers);
    }
    return ActionScheduler.instance;
  }

  async executeNode(node: Node<Action<T>>): Promise<void> {
    const incomingEdges = this.getIncomingEdges(node.id);
    const parentNodes = incomingEdges
      .map((edge) => this.findNode(edge.from))
      .filter(Boolean) as Node<Action<T>>[];

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

  async executeChildren(node: Node<Action<T>>): Promise<void> {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(Boolean) as Node<Action<T>>[];
    await Promise.all(
      childNodes.map(async (child) => {
        await this.executeNode(child);
      })
    );
  }

  async failAllChildren(node: Node<Action<T>>): Promise<void> {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(Boolean) as Node<Action<T>>[];
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

  async performAction(node: Node<Action<T>>): Promise<void> {
    if (node.data.type === ROOT) {
      throw new Error("Root node cannot be executed");
    }

    const handler = this.handlers[node.data.type as keyof T];
    if (!handler) {
      throw new Error(`Handler for type "${String(node.data.type)}" not found`);
    }
    await handler(...(node.data.params as Params<T[typeof node.data.type]>));
  }

  async run(): Promise<void> {
    const rootNode = this.findNode(ROOT);
    if (rootNode) {
      await this.executeNode(rootNode);
    } else {
      throw new Error("Root node not found");
    }
  }

  public override addNode(node: Node<Action<T>>): void {
    if (!node.data.status.type) {
      node.data.status = {
        type: Status.IDLE,
        text: "Node is idle",
      };
    }
    super.addNode(node);
  }

  public override removeNode(id: string): void {
    if (id === ROOT) {
      throw new Error("Root node cannot be removed");
    }
    super.removeNode(id);
  }

  public override removeNodeAndReattachChildren(id: string): void {
    if (id === ROOT) {
      throw new Error("Root node cannot be removed");
    }
    super.removeNodeAndReattachChildren(id);
  }

  public reset(): void {
    this.nodes = [];
    this.edges = [];
    const rootNode: Node<Action<T>> = {
      id: ROOT,
      data: {
        type: ROOT,
        params: {},
        status: { type: Status.OK, text: "Root node" },
      },
    };
    this.addNode(rootNode);
  }

  public serialize(): string {
    return JSON.stringify({
      nodes: this.nodes.map((node) => ({
        ...node,
        data: {
          status: node.data.status,
          type: node.data.type,
          params: node.data.params,
        },
      })),
      edges: this.edges,
    });
  }

  public deserialize(json: string): void {
    const data = JSON.parse(json);
    this.reset();

    this.nodes = data.nodes.map((node: Node<Action<T>>) => ({
      ...node,
      data: {
        ...node.data,
      },
    }));
    this.edges = data.edges;
  }
}

export default ActionScheduler;
export { Status, ROOT };
export type { StatusType, Node, Action, Handlers };
