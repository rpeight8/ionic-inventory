import DAG from "../../utils/DAG";
import type { Node, ID } from "../../utils/DAG";
import type {
  AsyncReturnTypeWithError,
  ReturnTypeWithError,
} from "../../types";
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
  text?: string;
};

type Action<
  T extends string = string,
  H extends (...args: any) => any = (...args: any) => any
> = {
  type: T;
  handler: H;
};

type ActionLoader<A extends Action> = (
  params: Parameters<A["handler"]>[0]
) => AsyncReturnTypeWithError<Promise<ReturnType<A["handler"]>>>;

type WithAction<A> =
  | {
      type: A extends Action ? A["type"] : any;
      payload: A extends Action ? Parameters<A["handler"]>[0] : any;
      status: StatusType;
    }
  | { type: typeof ROOT; payload: undefined; status: StatusType };

type ExtractHandlers<A extends Action> = {
  [K in A["type"]]: Extract<A, { type: K }>["handler"];
};

type Handler = {
  initialize?: () => Promise<void>;
};

type MergeHandlersWithActionLoaders<H extends Handler, A extends Action> = H & {
  [K in A["type"]]: ActionLoader<Extract<A, { type: K }>>;
};

type Handlers<A extends Action> = MergeHandlersWithActionLoaders<Handler, A>;

type NodeActionStatusHandlers<A extends Action> = {
  onOk?: (value: ReturnType<A["handler"]>) => void;
  onFail?: (error: Error) => void;
  onPending?: () => void;
  onWait?: () => void;
};

type addNodeParams<A extends Action> = {
  node: Node<WithAction<A>>;
  parentId: ID;
} & NodeActionStatusHandlers<A>;

type ActionSchedulerType<ValidActions extends Action> = DAG<
  WithAction<ValidActions>
> & {
  serialize(): string;
  deserialize(json: string): void;
  initialize(): Promise<void>;
  run(): Promise<void>;
  reset(): void;
  addNode<A extends ValidActions>(
    node: Node<WithAction<A>>,
    handlers: NodeActionStatusHandlers<A>
  ): ReturnTypeWithError<Promise<ReturnType<A["handler"]>>>;
  addNodeToNode<A extends ValidActions>(
    params: addNodeParams<A>
  ): ReturnTypeWithError<Promise<ReturnType<A["handler"]>>>;
  removeNode(id: string): ReturnTypeWithError<void>;
  removeNodeAndReattachChildren(id: string): ReturnTypeWithError<void>;
  findByType(type: ValidActions["type"]): Node<WithAction<ValidActions>>[];
  findByPredicate<A extends ValidActions>(
    predicate: (node: Node<WithAction<A>>) => boolean
  ): Node<WithAction<A>>[];
};

const ROOT = "ROOT";

class ActionSchedulerService<ValidActions extends Action>
  extends DAG<WithAction<ValidActions>>
  implements ActionSchedulerType<ValidActions>
{
  private static instance: ActionSchedulerService<any>;
  private handlers: Handlers<ValidActions>;
  private initialized = false;
  private promises: Map<
    ID,
    {
      resolve: (value: ReturnType<ValidActions["handler"]>) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private listeners: Map<
    ID,
    {
      onOk?: (value: ReturnType<ValidActions["handler"]>) => void;
      onFail?: (error: Error) => void;
      onPending?: () => void;
      onWait?: () => void;
    }
  > = new Map();

  private constructor(handlers: Handlers<ValidActions>) {
    super();
    this.handlers = handlers;
    this.reset();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.handlers.initialize) {
        await this.handlers.initialize();
      }
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize ActionSchedulerService", error);
      throw new Error("Failed to initialize ActionSchedulerService");
    }
  }

  public static getInstance<ValidActions extends Action>(
    handlers: Handlers<ValidActions>
  ): ActionSchedulerService<ValidActions> {
    if (!ActionSchedulerService.instance) {
      ActionSchedulerService.instance =
        new ActionSchedulerService<ValidActions>(handlers);
    }
    return ActionSchedulerService.instance;
  }

  private async executeNode(
    node: Node<WithAction<ValidActions>>
  ): Promise<void> {
    const parentNodes = this.getIncomingEdges(node.id)
      .map((edge) => this.findNode(edge.from))
      .filter(
        (parent): parent is Node<WithAction<ValidActions>> =>
          parent !== undefined
      );

    const allParentsOk = parentNodes.every(
      (parent) => parent.data.status.type === Status.OK
    );
    const anyParentFailed = parentNodes.some(
      (parent) => parent.data.status.type === Status.FAILED
    );
    const anyParentPending = parentNodes.some(
      (parent) => parent.data.status.type === Status.PENDING
    );

    if (node.id !== ROOT) {
      if (anyParentPending) return;
      if (anyParentFailed) return;
    }

    try {
      if (node.data.type === ROOT) {
        await this.executeChildren(node);
      } else {
        this.pendNode(node, "Action is being executed");
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

  private async executeChildren(
    node: Node<WithAction<ValidActions>>
  ): Promise<void> {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(
        (node): node is Node<WithAction<ValidActions>> => node !== undefined
      );
    await Promise.all(
      childNodes.map(async (child) => {
        await this.executeNode(child);
      })
    );
  }

  private failAllChildren(
    node: Node<WithAction<ValidActions>>,
    error: Error
  ): void {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(
        (node): node is Node<WithAction<ValidActions>> => node !== undefined
      );

    childNodes.map(async (child) => {
      this.failNode(child, error);
      this.failAllChildren(child, error);
    });
  }

  private waitAllChildren(
    node: Node<WithAction<ValidActions>>,
    text: string
  ): void {
    const outgoingEdges = this.getOutgoingEdges(node.id);
    const childNodes = outgoingEdges
      .map((edge) => this.findNode(edge.to))
      .filter(
        (node): node is Node<WithAction<ValidActions>> => node !== undefined
      );

    childNodes.map(async (child) => {
      this.waitNode(child, text);
      this.waitAllChildren(child, text);
    });
  }

  private async performAction(
    node: Node<WithAction<ValidActions>>
  ): Promise<any> {
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
        const res = await handler(node.data.payload);
        return res;
      } catch (error) {
        throw error;
      }
    }
  }

  private fireListeners(
    node: Node<WithAction<ValidActions>>,
    payload: ReturnType<ValidActions["handler"]>
  ): void {
    const listener = this.listeners.get(node.id);
    if (!listener) return;

    switch (node.data.status.type) {
      case Status.OK:
        listener.onOk?.(payload);
        break;
      case Status.FAILED:
        listener.onFail?.(new Error(node.data.status.text));
        break;
      case Status.PENDING:
        listener.onPending?.();
        break;
      case Status.WAITING:
        listener.onWait?.();
        break;
    }

    this.listeners.delete(node.id);
  }

  private updateNodeStatus(
    node: Node<WithAction<ValidActions>>,
    status: Status,
    text?: string,
    payload?: any
  ): void {
    node.data.status = { type: status, text };
    this.fireListeners(node, payload);
  }

  private failNode(
    node: Node<WithAction<ValidActions>>,
    error: Error,
    payload?: any
  ): void {
    if (node.data.type === ROOT) {
      throw new Error("Root node cannot fail");
    }

    this.updateNodeStatus(node, Status.FAILED, error.message, payload);
  }

  private waitNode(
    node: Node<WithAction<ValidActions>>,
    text?: string,
    payload?: any
  ): void {
    this.updateNodeStatus(node, Status.WAITING, text, payload);
  }

  private okNode(
    node: Node<WithAction<ValidActions>>,
    text?: string,
    payload?: any
  ): void {
    this.updateNodeStatus(node, Status.OK, text, payload);
  }

  private pendNode(
    node: Node<WithAction<ValidActions>>,
    text?: string,
    payload?: any
  ): void {
    this.updateNodeStatus(node, Status.PENDING, text, payload);
  }

  private idleNode(
    node: Node<WithAction<ValidActions>>,
    text?: string,
    payload?: any
  ): void {
    this.updateNodeStatus(node, Status.IDLE, payload);
  }

  public async run(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Service is not initialized");
    }

    const rootNode = this.findNode(ROOT);
    if (!rootNode) {
      throw new Error("Service is not initialized");
    }

    try {
      await this.executeNode(rootNode);
    } catch (error) {
      console.error("Failed to run scheduler", error);
    }
  }

  // @ts-ignore
  // TODO: Fix this
  private override addNode<A extends ValidActions>(
    node: Node<WithAction<A>>,
    { onOk, onFail, onPending, onWait }: NodeActionStatusHandlers<A>
  ): ReturnTypeWithError<Promise<ReturnType<A["handler"]>>> {
    try {
      if (!node.data.status.type) {
        node.data.status = {
          type: Status.IDLE,
        };
      }

      if (node.data.type === ROOT) {
        return [, new Error("Root node cannot be added")];
      }

      if (onOk || onFail || onPending || onWait) {
        this.listeners.set(node.id, { onOk, onFail, onPending, onWait });
      }

      const promise = new Promise<ReturnType<A["handler"]>>(
        (resolve, reject) => {
          this.promises.set(node.id, {
            resolve,
            reject,
          });
        }
      );

      super.addNode(node);
      return [promise];
    } catch (error) {
      console.log("Failed to add node", error);
      if (this.listeners.has(node.id)) this.listeners.delete(node.id);
      if (this.promises.has(node.id)) this.promises.delete(node.id);
      return [, new Error(`Failed to add node with id ${node.id}`)];
    }
  }

  public addNodeToNode<A extends ValidActions>({
    node,
    parentId,
    ...rest
  }: {
    node: Node<WithAction<A>>;
    parentId: ID;
  } & NodeActionStatusHandlers<A>): ReturnTypeWithError<
    Promise<ReturnType<A["handler"]>>
  > {
    try {
      const parent = this.findNode(parentId);
      if (!parent) {
        return [, new Error(`Parent node with id ${parentId} not found`)];
      }

      const result = this.addNode<A>(node, {
        ...rest,
      });

      if (result[1]) {
        return result;
      }

      this.addEdge(parentId, node.id);
      this.idleNode(node);

      return result;
    } catch (error) {
      console.log("Failed to add node", error);

      return [, new Error(`Failed to add node with id ${node.id}`)];
    }
  }

  public override removeNode(id: string): ReturnTypeWithError<void> {
    try {
      if (id === ROOT) {
        return new Error("Root node cannot be removed");
      }
      super.removeNode(id);
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      return new Error("Unexpected error: failed to remove node");
    }
  }

  public override removeNodeAndReattachChildren(
    id: string
  ): ReturnTypeWithError<void> {
    try {
      if (id === ROOT) {
        return new Error("Root node cannot be removed");
      }
      super.removeNodeAndReattachChildren(id);
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      return new Error("Unexpected error: failed to remove node");
    }
    if (id === ROOT) {
      throw new Error("Root node cannot be removed");
    }
  }

  public findByType(
    type: ValidActions["type"]
  ): Node<WithAction<ValidActions>>[] {
    return this.nodes.filter((node) => node.data.type === type);
  }

  public findByPredicate<A extends ValidActions>(
    predicate: (node: Node<WithAction<A>>) => boolean
  ): Node<WithAction<A>>[] {
    return this.nodes.filter(predicate);
  }

  public reset(): void {
    this.nodes = [];
    this.edges = [];
    const rootNode: Node<WithAction<ValidActions>> = {
      id: ROOT,
      data: {
        type: ROOT,
        payload: undefined,
        status: { type: Status.OK },
      },
    };
    this.listeners.clear();
    this.listeners = new Map();
    this.promises.clear();
    this.promises = new Map();
    this.addNode(rootNode, {});
  }

  public serialize(): string {
    return JSON.stringify({
      nodes: this.nodes.map((node) => ({
        ...node,
        data: {
          status: node.data.status,
          type: node.data.type,
          payload: node.data.payload,
        },
      })),
      edges: this.edges,
    });
  }

  public deserialize(json: string): void {
    const data = JSON.parse(json);
    this.reset();

    this.nodes = data.nodes.map((node: Node<WithAction<ValidActions>>) => ({
      ...node,
      data: {
        ...node.data,
      },
    }));
    this.edges = data.edges;
  }
}

export default ActionSchedulerService;
export { Status, ROOT as RootNodeId };
export type { StatusType, Node, Action, Handlers, ActionSchedulerType };
