import DAG from "../../utils/DAG";
import type { Node, ID } from "../../utils/DAG";
import type { ActionType, ActionsHandlers } from "../../types";
import { v4 as uuidv4 } from "uuid";

enum Status {
  OK = "ok",
  PENDING = "pending",
  IDLE = "idle",
  WAITING = "waiting",
  FAILED = "failed",
}

type StatusType = {
  type: Status;
  text: string;
};

type Action =
  | {
      type: any;
      params: any;
      status: StatusType;
    }
  | { type: typeof ROOT; params: undefined; status: StatusType };

type Handlers = {
  [key: string]: (...args: any) => Promise<any>;
};
type ActionSchedulerType = DAG<Action> & {
  serialize(): string;
  deserialize(json: string): void;
  initialize(): Promise<void>;
  run(): Promise<void>;
  reset(): void;
  addNode<R>(node: Node<Action>): Promise<R>;
};

const ROOT = "ROOT";

class ActionSchedulerService
  extends DAG<Action>
  implements ActionSchedulerType
{
  private static instance: ActionSchedulerService;
  private handlers: Handlers;
  private initialized = false;
  private promises: Map<
    ID,
    {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
    }
  > = new Map();

  private constructor(handlers: Handlers) {
    super();
    this.handlers = handlers;
    this.reset();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if ("initialize" in this.handlers) {
        await this.handlers.initialize();
      }
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize ActionSchedulerService", error);
      throw new Error("Failed to initialize ActionSchedulerService");
    }
  }

  public static getInstance(handlers: Handlers): ActionSchedulerService {
    if (!ActionSchedulerService.instance) {
      ActionSchedulerService.instance = new ActionSchedulerService(handlers);
    }
    return ActionSchedulerService.instance as ActionSchedulerService;
  }

  private async executeNode(node: Node<Action>): Promise<void> {
    const incomingEdges = this.getIncomingEdges(node.id);
    const parentNodes = incomingEdges
      .map((edge) => this.findNode(edge.from))
      .filter((node): node is Node<Action> => node !== undefined);

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
      return;
    }

    if (node.id !== ROOT && anyParentFailed) {
      return;
    }

    try {
      if (node.data.type === ROOT) {
        await this.executeChildren(node);
      } else {
        this.pendingNode(node, "Action is being executed");
        this.waitAllChildren(node, "Waiting for parent tasks to complete");
        const res = await this.performAction(node);
        this.okNode(node, res);
        await this.executeChildren(node);
      }
    } catch (error) {
      this.failNode(node, error as Error);
      this.failAllChildren(node, error as Error);
    }
  }

  private async executeChildren(node: Node<Action>): Promise<void> {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter((node): node is Node<Action> => node !== undefined);
    await Promise.all(
      childNodes.map(async (child) => {
        await this.executeNode(child);
      })
    );
  }

  private failAllChildren(node: Node<Action>, error: Error): void {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter((node): node is Node<Action> => node !== undefined);

    childNodes.map(async (child) => {
      this.failNode(child, error);
      this.failAllChildren(child, error);
    });
  }

  private waitAllChildren(node: Node<Action>, text: string): void {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter((node): node is Node<Action> => node !== undefined);

    childNodes.map(async (child) => {
      this.waitNode(child, text);
      this.waitAllChildren(child, text);
    });
  }

  private async performAction(node: Node<Action>): Promise<void> {
    if (node.data.type === ROOT) {
      throw new Error("Root node cannot be executed");
    }
    if (!node.data.type) {
      throw new Error("Action type not found");
    }

    if (node.data.type in this.handlers) {
      const handler = this.handlers[node.data.type];

      if (!handler) {
        throw new Error(
          `Handler for type "${String(node.data.type)}" not found`
        );
      }
      try {
        const res = await handler(node.data.params);
        return res;
      } catch (error) {
        throw error;
      }
    }
  }

  private rejectPromise(id: ID, error: Error): void {
    if (this.promises.has(id)) {
      const { reject } = this.promises.get(id)!;
      reject(error);
      this.promises.delete(id);
    }
  }

  private resolvePromise(id: ID, value: any): void {
    if (this.promises.has(id)) {
      const { resolve } = this.promises.get(id)!;
      resolve(value);
      this.promises.delete(id);
    }
  }

  private failNode(node: Node<Action>, error: Error): void {
    node.data.status = {
      type: Status.FAILED,
      text: error.message,
    };
    this.rejectPromise(node.id, error);
  }

  private waitNode(node: Node<Action>, text: string): void {
    node.data.status = {
      type: Status.WAITING,
      text,
    };
  }

  private okNode(node: Node<Action>, value: any): void {
    node.data.status = {
      type: Status.OK,
      text: "Action performed successfully",
    };
    this.resolvePromise(node.id, value);
  }

  private pendingNode(node: Node<Action>, text: string): void {
    node.data.status = {
      type: Status.PENDING,
      text,
    };
  }

  public async run(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Service is not initialized");
    }

    const rootNode = this.findNode(ROOT);
    if (rootNode) {
      try {
        await this.executeNode(rootNode);
      } catch (error) {
        console.error("Failed to run scheduler", error);
      }
    } else {
      throw new Error("Root node not found");
    }
  }

  public override addNode<R>(node: Node<Action>): Promise<R> {
    if (!node.data.status.type) {
      node.data.status = {
        type: Status.IDLE,
        text: "Node is idle",
      };
    }
    // TODO: Remove this check once all nodes have an id asssigned by the caller
    if (!node.id) {
      node.id = uuidv4();
    }

    const promise = new Promise<R>((resolve, reject) => {
      this.promises.set(node.id, { resolve, reject });
    });

    super.addNode(node);
    return promise;
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
    const rootNode: Node<Action> = {
      id: ROOT,
      data: {
        type: ROOT,
        params: undefined,
        status: { type: Status.OK, text: "Root node" },
      },
    };
    this.promises.clear();
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

    this.nodes = data.nodes.map((node: Node<Action>) => ({
      ...node,
      data: {
        ...node.data,
      },
    }));
    this.edges = data.edges;
  }
}

export default ActionSchedulerService;
export { Status, ROOT };
export type { StatusType, Node, Action, Handlers, ActionSchedulerType };
