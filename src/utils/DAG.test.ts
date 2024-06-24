import { DAG } from "./DAG";
import type { Node } from "./DAG";

describe("DAG", () => {
  let dag: DAG<any>;

  beforeEach(() => {
    dag = new DAG();
  });

  test("should add nodes correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };

    dag.addNode(node1);
    dag.addNode(node2);

    expect(dag.nodes).toContain(node1);
    expect(dag.nodes).toContain(node2);
  });

  test("should add edges correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addEdge(1, 2);

    expect(dag.edges).toContainEqual({ from: 1, to: 2 });
  });

  test("should detect cycles correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);

    dag.addEdge(1, 2);
    dag.addEdge(2, 3);

    expect(dag.hasCycle()).toBe(false);

    dag.addEdge(3, 1);

    expect(dag.hasCycle()).toBe(true);
  });

  test("should perform topological sort correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);

    dag.addEdge(1, 2);
    dag.addEdge(2, 3);

    const sortedNodes = dag.topologicalSort();

    expect(sortedNodes.map((node) => node.id)).toEqual([1, 2, 3]);
  });

  test("should generate correct debug drawing", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);

    dag.addEdge(1, 2);
    dag.addEdge(2, 3);

    const expectedOutput = `Node 1: {"name":"Task 1"}\n  -> 2\nNode 2: {"name":"Task 2"}\n  -> 3\nNode 3: {"name":"Task 3"}\n`;

    expect(dag.debugDraw()).toBe(expectedOutput);
  });

  test("should generate correct debug drawing for a complex graph", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };
    const node4: Node<any> = { id: 4, data: { name: "Task 4" } };
    const node5: Node<any> = { id: 5, data: { name: "Task 5" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);
    dag.addNode(node4);
    dag.addNode(node5);

    dag.addEdge(1, 2);
    dag.addEdge(1, 3);
    dag.addEdge(2, 4);
    dag.addEdge(3, 4);
    dag.addEdge(4, 5);

    const expectedOutput =
      `Node 1: {"name":"Task 1"}\n  -> 2\n  -> 3\n` +
      `Node 2: {"name":"Task 2"}\n  -> 4\n` +
      `Node 3: {"name":"Task 3"}\n  -> 4\n` +
      `Node 4: {"name":"Task 4"}\n  -> 5\n` +
      `Node 5: {"name":"Task 5"}\n`;

    console.log(dag.debugDraw());

    expect(dag.debugDraw()).toBe(expectedOutput);
  });

  test("should generate correct debug object for a complex graph", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };
    const node4: Node<any> = { id: 4, data: { name: "Task 4" } };
    const node5: Node<any> = { id: 5, data: { name: "Task 5" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);
    dag.addNode(node4);
    dag.addNode(node5);

    dag.addEdge(1, 2);
    dag.addEdge(1, 3);
    dag.addEdge(2, 4);
    dag.addEdge(3, 4);
    dag.addEdge(4, 5);

    const expectedDebugObject = {
      1: { data: { name: "Task 1" }, outgoing: [2, 3], incoming: [] },
      2: { data: { name: "Task 2" }, outgoing: [4], incoming: [1] },
      3: { data: { name: "Task 3" }, outgoing: [4], incoming: [1] },
      4: { data: { name: "Task 4" }, outgoing: [5], incoming: [2, 3] },
      5: { data: { name: "Task 5" }, outgoing: [], incoming: [4] },
    };

    console.log(dag.toDebugObject());

    expect(dag.toDebugObject()).toEqual(expectedDebugObject);
  });

  test("should find node by id", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };

    dag.addNode(node1);
    dag.addNode(node2);

    expect(dag.findNode(1)).toBe(node1);
    expect(dag.findNode(2)).toBe(node2);
    expect(dag.findNode(3)).toBeUndefined();
  });

  test("should remove nodes and associated edges correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addEdge(1, 2);

    dag.removeNode(1);

    expect(dag.nodes).not.toContain(node1);
    expect(dag.edges).not.toContainEqual({ from: 1, to: 2 });
  });

  test("should get incoming edges correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);

    dag.addEdge(1, 2);
    dag.addEdge(3, 2);

    const incomingEdges = dag.getIncomingEdges(2);

    expect(incomingEdges).toEqual([
      { from: 1, to: 2 },
      { from: 3, to: 2 },
    ]);
  });

  test("should get outgoing edges correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);

    dag.addEdge(1, 2);
    dag.addEdge(1, 3);

    const outgoingEdges = dag.getOutgoingEdges(1);

    expect(outgoingEdges).toEqual([
      { from: 1, to: 2 },
      { from: 1, to: 3 },
    ]);
  });

  test("should verify dependencies correctly", () => {
    const node1: Node<any> = { id: 1, data: { name: "Task 1" } };
    const node2: Node<any> = { id: 2, data: { name: "Task 2" } };
    const node3: Node<any> = { id: 3, data: { name: "Task 3" } };

    dag.addNode(node1);
    dag.addNode(node2);
    dag.addNode(node3);

    dag.addEdge(1, 2);
    dag.addEdge(2, 3);

    expect(dag.isDependent(1, 3)).toBe(true);
    expect(dag.isDependent(3, 1)).toBe(false);
  });

  test("should handle non-existent nodes and edges correctly", () => {
    expect(() => dag.addEdge(1, 2)).not.toThrow();

    dag.addNode({ id: 1, data: { name: "Task 1" } });
    dag.addNode({ id: 2, data: { name: "Task 2" } });
    dag.addEdge(1, 2);

    dag.removeNode(3); // Node 3 does not exist
    expect(dag.nodes.length).toBe(2);

    dag.removeNode(1); // Node 1 exists
    expect(dag.nodes.length).toBe(1);
    expect(dag.edges.length).toBe(0);
  });
});
