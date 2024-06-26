type ID = string;

interface Node<T> {
  id: ID;
  data: T;
}

interface Edge {
  from: ID;
  to: ID;
}

interface IDAG<T> {
  nodes: Node<T>[];
  edges: Edge[];

  addNode(node: Node<T>): void;
  addEdge(from: ID, to: ID): void;
  findNode(id: ID): Node<T> | undefined;
  removeNode(id: ID): void;
  removeNodeAndReattachChildren(id: ID): void;
  removeEdge(from: ID, to: ID): void;
  getIncomingEdges(id: ID): Edge[];
  getOutgoingEdges(id: ID): Edge[];
  topologicalSort(): Node<T>[];
  isDependent(from: ID, to: ID): boolean;
  hasCycle(): boolean;
  debugDraw(): string;
  toDebugObject(): Record<ID, any>;
}

export class DAG<T> implements IDAG<T> {
  nodes: Node<T>[];
  edges: Edge[];

  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  public addNode(node: Node<T>): void {
    this.nodes.push(node);
  }

  public addEdge(from: ID, to: ID): void {
    this.edges.push({ from, to });
  }

  public findNode(id: ID): Node<T> | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  public removeNode(id: ID): void {
    // Remove the node itself
    this.nodes = this.nodes.filter((node) => node.id !== id);

    // Get all outgoing edges from the node to be removed
    const outgoingEdges = this.getOutgoingEdges(id);

    // Remove all edges connected to the node
    this.edges = this.edges.filter(
      (edge) => edge.from !== id && edge.to !== id
    );

    // Recursively remove child nodes that are no longer connected
    outgoingEdges.forEach((edge) => {
      const childNodeId = edge.to;
      const childNode = this.findNode(childNodeId);

      if (childNode && !this.hasIncomingEdges(childNodeId)) {
        this.removeNode(childNodeId);
      }
    });
  }

  public removeEdge(from: ID, to: ID): void {
    this.edges = this.edges.filter(
      (edge) => edge.from !== from || edge.to !== to
    );
  }

  public removeNodeAndReattachChildren(id: ID): void {
    const nodeToRemove = this.findNode(id);
    if (!nodeToRemove) return;

    // Find all incoming edges to the node being removed
    const incomingEdges = this.getIncomingEdges(id);

    // Find all outgoing edges from the node being removed
    const outgoingEdges = this.getOutgoingEdges(id);

    // Remove the node and all its edges
    this.nodes = this.nodes.filter((node) => node.id !== id);
    this.edges = this.edges.filter(
      (edge) => edge.from !== id && edge.to !== id
    );

    // Reattach children to the parent(s) of the node being removed
    incomingEdges.forEach((incomingEdge) => {
      outgoingEdges.forEach((outgoingEdge) => {
        this.addEdge(incomingEdge.from, outgoingEdge.to);
      });
    });
  }

  public getIncomingEdges(id: ID): Edge[] {
    return this.edges.filter((edge) => edge.to === id);
  }

  public getOutgoingEdges(id: ID): Edge[] {
    return this.edges.filter((edge) => edge.from === id);
  }

  public topologicalSort(): Node<T>[] {
    const sorted: Node<T>[] = [];
    const nodes = [...this.nodes];
    const edges = [...this.edges];

    while (nodes.length > 0) {
      const noIncomingEdges: Node<T>[] = nodes.filter((node) => {
        return !edges.some((edge) => edge.to === node.id);
      });

      if (noIncomingEdges.length === 0) {
        throw new Error("Graph has at least one cycle");
      }

      noIncomingEdges.forEach((node) => {
        sorted.push(node);

        edges
          .filter((edge) => edge.from === node.id)
          .forEach((edge) => {
            const index = edges.indexOf(edge);
            edges.splice(index, 1);
          });

        const index = nodes.indexOf(node);
        nodes.splice(index, 1);
      });
    }

    return sorted;
  }

  public isDependent(from: ID, to: ID): boolean {
    const edges = [...this.edges];

    const visit = (nodeId: ID): boolean => {
      if (nodeId === to) return true;

      return edges
        .filter((edge) => edge.from === nodeId)
        .some((edge) => visit(edge.to));
    };

    return visit(from);
  }

  public hasCycle(): boolean {
    try {
      this.topologicalSort();
      return false;
    } catch (error) {
      return true;
    }
  }

  public debugDraw(): string {
    let output = "";
    this.nodes.forEach((node) => {
      output += `Node ${node.id}: ${JSON.stringify(node.data)}\n`;
      const outgoingEdges = this.getOutgoingEdges(node.id);
      outgoingEdges.forEach((edge) => {
        output += `  -> ${edge.to}\n`;
      });
    });
    return output;
  }

  public toDebugObject(): Record<ID, any> {
    const debugObject: Record<ID, any> = {};

    this.nodes.forEach((node) => {
      debugObject[node.id] = {
        data: node.data,
        outgoing: this.getOutgoingEdges(node.id).map((edge) => edge.to),
        incoming: this.getIncomingEdges(node.id).map((edge) => edge.from),
      };
    });

    return debugObject;
  }

  private hasIncomingEdges(id: ID): boolean {
    return this.edges.some((edge) => edge.to === id);
  }
}

export default DAG;
export type { Node, Edge, IDAG, ID };
