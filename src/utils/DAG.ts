type ID = string | number;

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

  addNode(node: Node<T>): void {
    this.nodes.push(node);
  }

  addEdge(from: ID, to: ID): void {
    this.edges.push({ from, to });
  }

  findNode(id: ID): Node<T> | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  removeNode(id: ID): void {
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

  getIncomingEdges(id: ID): Edge[] {
    return this.edges.filter((edge) => edge.to === id);
  }

  getOutgoingEdges(id: ID): Edge[] {
    return this.edges.filter((edge) => edge.from === id);
  }

  topologicalSort(): Node<T>[] {
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

  isDependent(from: ID, to: ID): boolean {
    const edges = [...this.edges];

    const visit = (nodeId: ID): boolean => {
      if (nodeId === to) return true;

      return edges
        .filter((edge) => edge.from === nodeId)
        .some((edge) => visit(edge.to));
    };

    return visit(from);
  }

  hasCycle(): boolean {
    try {
      this.topologicalSort();
      return false;
    } catch (error) {
      return true;
    }
  }

  debugDraw(): string {
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

  toDebugObject(): Record<ID, any> {
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
