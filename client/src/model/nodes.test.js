import {
  createNode,
  withNodeParentId,
  withNodeOrder,
  withNodeData,
  withNodeIsExpanded,
  canBeRemoved,
  createState,
  createSelection,
  emptySelection,
  iterateAugumentedNodes,
  filterHidden,
  filterNone,
  nodesApi,
  arrayToNodeSet,
} from "./nodes.js";
import deepFreeze from "deep-freeze";
import { type, replaceOp } from "../model/optype.js";

describe("createNode", () => {
  test("With no parameters creates new ID", () => {
    const node = createNode();
    expect(node.id).not.toBeNull();
  });
  test("With all parameters fully initalizes", () => {
    const node = createNode("id", "parentId", 2.0, true, "data");
    expect(node.id).toBe("id");
    expect(node.parentId).toBe("parentId");
    expect(node.order).toBe(2.0);
    expect(node.isExpanded).toBe(true);
    expect(node.data).toBe("data");
  });
});

describe("withNodeParentId", () => {
  test("With new parentId returns new object with new parentId", () => {
    const node = deepFreeze({ parentId: 2 });
    const actual = withNodeParentId(node, 3);
    expect(actual.parentId).toBe(3);
  });
});

describe("withNodeOrder", () => {
  test("With new order returns new object with new order", () => {
    const node = deepFreeze({ order: 2 });
    const actual = withNodeOrder(node, 3);
    expect(actual.order).toBe(3);
  });
});

describe("withNodeIsExpanded", () => {
  test("With new isExpanded returns new object with new isExpanded", () => {
    const node = deepFreeze({ isExpanded: false });
    const actual = withNodeIsExpanded(node, true);
    expect(actual.isExpanded).toBe(true);
  });
});

describe("withNodeData", () => {
  test("With new isExpanded returns new object with new isExpanded", () => {
    const node = { data: "A" };
    const actual = withNodeData(node, "B");
    expect(actual.data).toBe("B");
  });
});

test("getNodeById", () => {
  const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const api = nodesApi(createState(nodes));
  expect(api.getNodeById("a")).toBe(nodes[0]);
  expect(api.getNodeById("b")).toBe(nodes[1]);
  expect(api.getNodeById("c")).toBe(nodes[2]);
});

test("getChildren", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a", order: 1 },
    { id: "c", parentId: "a", order: 0 },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getChildren(nodes[0])).toStrictEqual([nodes[2], nodes[1]]);
  expect(api.getChildren(nodes[1])).toStrictEqual([]);
  expect(api.getChildren(nodes[2])).toStrictEqual([]);
});

test("getSiblings", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a", order: 1 },
    { id: "c", parentId: "a", order: 0 },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getSiblings(nodes[0])).toStrictEqual([nodes[0]]);
  expect(api.getSiblings(nodes[1])).toStrictEqual([nodes[2], nodes[1]]);
  expect(api.getSiblings(nodes[2])).toStrictEqual([nodes[2], nodes[1]]);
});

test("getPathToRoot", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
  ];
  const api = nodesApi(createState(nodes));
  expect([...api.getPathToRoot(nodes[0])]).toStrictEqual([]);
  expect([...api.getPathToRoot(nodes[1])]).toStrictEqual([nodes[0]]);
  expect([...api.getPathToRoot(nodes[2])]).toStrictEqual([nodes[1], nodes[0]]);
});

test("getIndentation", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getIndentation(nodes[0])).toBe(0);
  expect(api.getIndentation(nodes[1])).toBe(1);
  expect(api.getIndentation(nodes[2])).toBe(2);
});

describe("getVisibleNodes", () => {
  test("With all nodes visible", () => {
    const nodes = [
      { id: "a", parentId: null, isExpanded: true },
      { id: "b", parentId: "a", isExpanded: true },
      { id: "c", parentId: "b", isExpanded: true },
      { id: "d", parentId: "c" },
      { id: "e", parentId: "a" },
    ];
    const api = nodesApi(createState(nodes));
    const output = api.getVisibleNodes();
    expect(output).toStrictEqual(nodes);
  });
  test("With some nodes invisible", () => {
    const nodes = [
      { id: "a", parentId: null, isExpanded: true },
      { id: "b", parentId: "a", isExpanded: false },
      { id: "c", parentId: "b", isExpanded: true },
      { id: "d", parentId: "c", isExpanded: true },
      { id: "e", parentId: "a", isExpanded: true },
    ];
    const api = nodesApi(createState(nodes));
    const output = api.getVisibleNodes();
    expect(output).toStrictEqual([nodes[0], nodes[1], nodes[4]]);
  });
  test("With three nodes invisible", () => {
    const nodes = [
      { id: "a", parentId: null, isExpanded: true },
      { id: "b", parentId: "a", isExpanded: false },
      { id: "c", parentId: "b" },
    ];
    const api = nodesApi(createState(nodes));
    const output = api.getVisibleNodes();
    expect(output).toStrictEqual([nodes[0], nodes[1]]);
  });
});

test("getDescendants", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
    { id: "d", parentId: "c" },
    { id: "e", parentId: "a" },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getDescendants(nodes[0])).toStrictEqual(nodes.slice(1));
  expect(api.getDescendants(nodes[1])).toStrictEqual(nodes.slice(2, 4));
  expect(api.getDescendants(nodes[2])).toStrictEqual(nodes.slice(3, 4));
  expect(api.getDescendants(nodes[3])).toStrictEqual([]);
  expect(api.getDescendants(nodes[4])).toStrictEqual([]);
});

test("getNodeAndDescendants", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
    { id: "d", parentId: "c" },
    { id: "e", parentId: "a" },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getNodeAndDescendants(nodes[0])).toStrictEqual(nodes);
  expect(api.getNodeAndDescendants(nodes[1])).toStrictEqual(nodes.slice(1, 4));
});

test("getPreviousSibling", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "a" },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getPreviousSibling(nodes[0])).toBeNull();
  expect(api.getPreviousSibling(nodes[1])).toBeNull();
  expect(api.getPreviousSibling(nodes[2])).toBe(nodes[1]);
});

test("getNextSibling", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "a" },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getNextSibling(nodes[0])).toBeNull();
  expect(api.getNextSibling(nodes[1])).toBe(nodes[2]);
  expect(api.getNextSibling(nodes[2])).toBeNull();
});

test("getNextSiblings", () => {
  const nodes = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "a" },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getNextSiblings(nodes[0])).toStrictEqual([]);
  expect(api.getNextSiblings(nodes[1])).toStrictEqual([nodes[2]]);
  expect(api.getNextSiblings(nodes[2])).toStrictEqual([]);
});

test("getPreviousNode", () => {
  const nodes = [
    { id: "a", parentId: null, isExpanded: true },
    { id: "b", parentId: "a", isExpanded: false },
    { id: "c", parentId: "b", isExpanded: true },
    { id: "d", parentId: "a", isExpanded: true },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getPreviousNode(nodes[0])).toBeNull();
  expect(api.getPreviousNode(nodes[1])).toBe(nodes[0]);
  expect(api.getPreviousNode(nodes[2])).toBeNull();
  expect(api.getPreviousNode(nodes[3])).toBe(nodes[1]);
});

test("getNextNode", () => {
  const nodes = [
    { id: "a", parentId: null, isExpanded: true },
    { id: "b", parentId: "a", isExpanded: false },
    { id: "c", parentId: "b", isExpanded: true },
    { id: "d", parentId: "a", isExpanded: true },
  ];
  const api = nodesApi(createState(nodes));
  expect(api.getNextNode(nodes[0])).toBe(nodes[1]);
  expect(api.getNextNode(nodes[1])).toBe(nodes[3]);
  expect(api.getNextNode(nodes[2])).toBeNull();
  expect(api.getNextNode(nodes[3])).toBeNull();
});

describe("withOp", () => {
  test("Single operation is executed", () => {
    const nodes = [{ id: "a", value0: "A" }];
    const before = createState(nodes);
    const api = nodesApi(before);
    const after = api.withOp(replaceOp(["nodes", "a", "value0"], "B")).commit();
    expect(after.state.nodes.a.value0).toBe("B");
  });
  test("Two operations are executed", () => {
    const nodes = [{ id: "a", value0: "A", value1: "C" }];
    const before = createState(nodes);
    const api = nodesApi(before);
    const after = api
      .withOp(
        type.compose(
          replaceOp(["nodes", "a", "value0"], "B"),
          replaceOp(["nodes", "a", "value1"], "D")
        )
      )
      .commit();
    expect(after.state.nodes.a.value0).toBe("B");
    expect(after.state.nodes.a.value1).toBe("D");
  });
});

describe("withNodesInsertedAsFirstChild", () => {
  test("Append single node to empty parent adds to array and sets parentId and order", () => {
    const nodes = { a: { id: "a", parentId: null, order: 0 } };
    const node = { id: "b" };
    const output = nodesApi(createState(nodes))
      .withNodesInsertedAsFirstChild(nodes.a, node)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
    });
  });
  test("Append single node to array but sets parentId and order to become first", () => {
    const nodes = {
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
    };
    const node = { id: "c" };
    const output = nodesApi(createState(nodes))
      .withNodesInsertedAsFirstChild(nodes.a, node)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
      c: { id: "c", parentId: "a", order: -1 },
    });
  });
  test("Append two nodes to array but sets parentId and order to become first", () => {
    const nodes = {
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
    };
    const node = [{ id: "c" }, { id: "d" }];
    const output = nodesApi(createState(nodes))
      .withNodesInsertedAsFirstChild(nodes.a, node)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
      c: { id: "c", parentId: "a", order: -2 },
      d: { id: "d", parentId: "a", order: -1 },
    });
  });
});

describe("withNodesInsertedAsSibling", () => {
  test("Append single node to single sibling adds to array and sets parentId and order", () => {
    const nodes = {
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
    };
    const node = { id: "c" };
    const output = nodesApi(createState(nodes))
      .withNodesInsertedAsSibling(nodes.b, node)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
      c: { id: "c", parentId: "a", order: 1 },
    });
  });
  test("Append single node to single sibling adds to array and sets parentId and order", () => {
    const nodes = {
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
      c: { id: "c", parentId: "a", order: 1 },
    };
    const node = [{ id: "d" }, { id: "e" }, { id: "f" }];
    const output = nodesApi(createState(nodes))
      .withNodesInsertedAsSibling(nodes.b, node)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", parentId: null, order: 0 },
      b: { id: "b", parentId: "a", order: 0 },
      c: { id: "c", parentId: "a", order: 1 },
      d: { id: "d", parentId: "a", order: 0.25 },
      e: { id: "e", parentId: "a", order: 0.5 },
      f: { id: "f", parentId: "a", order: 0.75 },
    });
  });
});

describe("withNodesRemoved", () => {
  test("Removing node with child also removes child and selection", () => {
    const nodes = {
      a: { id: "a", parentId: null },
      b: { id: "b", parentId: "a" },
      c: { id: "c", parentId: "b" },
      d: { id: "d", parentId: "a" },
    };
    const selection = createSelection("b");
    const initialState = createState(nodes, selection);
    const finalState = nodesApi(initialState)
      .withNodesRemoved(nodes.b)
      .commit().state;
    expect(finalState.nodes).toStrictEqual({
      a: { id: "a", parentId: null },
      d: { id: "d", parentId: "a" },
    });
    expect(finalState.selection).toStrictEqual(emptySelection());
  });
});

describe("withNewRootId", () => {
  test("With root getting new parentId", () => {
    const nodes = {
      a: { id: "a", parentId: null },
      b: { id: "b", parentId: "a" },
    };
    const output = nodesApi(createState(nodes)).withNewRootId("c").commit()
      .state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", parentId: "c" },
      b: { id: "b", parentId: "a" },
    });
  });
});

describe("withNodesSwapped", () => {
  test("Simple tree", () => {
    const nodes = arrayToNodeSet([
      { id: "a", parentId: null, order: 0 },
      { id: "b", parentId: "a", order: 0 },
      { id: "c", parentId: "a", order: 1 },
    ]);
    const output = nodesApi(createState(nodes))
      .withNodesSwapped(nodes.b, nodes.c)
      .commit().state.nodes;
    expect(output).toStrictEqual(
      arrayToNodeSet([
        { id: "a", parentId: null, order: 0 },
        { id: "b", parentId: "a", order: 1 },
        { id: "c", parentId: "a", order: 0 },
      ])
    );
  });
});

describe("withNodesRemovedByPredicate", () => {
  test("Node with text does not get removed", () => {
    const nodes = {
      a: { id: "a", data: null, parentId: null },
      b: { id: "b", data: "Text", parentId: "a" },
    };
    const output = nodesApi(createState(nodes))
      .withNodesRemovedByPredicate(canBeRemoved)
      .commit().state.nodes;
    expect(output).toStrictEqual(nodes);
  });
  test("Node without text gets removed", () => {
    const nodes = {
      a: { id: "a", data: "", parentId: null },
      b: { id: "b", data: null, parentId: "a" },
    };
    const output = nodesApi(createState(nodes))
      .withNodesRemovedByPredicate(canBeRemoved)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", data: "", parentId: null },
    });
  });
  test("Node without text and children also removed children", () => {
    const nodes = {
      a: { id: "a", data: null, parentId: null },
      b: { id: "b", data: null, parentId: "a" },
      c: { id: "c", data: "Abc", parentId: "b" },
    };
    const output = nodesApi(createState(nodes))
      .withNodesRemovedByPredicate(canBeRemoved)
      .commit().state.nodes;
    expect(output).toStrictEqual({
      a: { id: "a", data: null, parentId: null },
    });
  });
});

describe("iterateAugumentedNodes", () => {
  const nodes = {
    a: { parentId: null, id: "a", isExpanded: false },
    b: { parentId: "c", id: "b", isExpanded: false },
    c: { parentId: "a", id: "c", isExpanded: false },
  };
  const input = nodesApi(createState(nodes)).withAugmentedChildren().state
    .nodes;
  test("Iterates tree with hidden nodes", () => {
    const output = [...iterateAugumentedNodes(input.a, filterNone)].map(
      (n) => n.id
    );
    expect(output).toStrictEqual(["a", "c", "b"]);
  });
  test("Iterates tree without hidden nodes", () => {
    const output = [...iterateAugumentedNodes(input.a, filterHidden)].map(
      (n) => n.id
    );
    expect(output).toStrictEqual(["a"]);
  });
});

describe("withAugmentedChildren", () => {
  test("Adds children to parents", () => {
    const nodes = {
      a: { parentId: null, id: "a" },
      b: { parentId: "a", id: "b" },
      c: { parentId: "b", id: "c" },
    };
    const selection = {
      id: "b",
      request: { type: "index" },
    };
    const output = nodesApi(
      createState(nodes, selection)
    ).withAugmentedChildren(true).state.nodes;

    const expected = {
      a: { ...nodes.a, hasFocus: false },
      b: {
        ...nodes.b,
        hasFocus: true,
        selectionRequest: { type: "index" },
      },
      c: { ...nodes.c, hasFocus: false },
    };
    expected.a.children = [expected.b];
    expected.b.children = [expected.c];
    expected.c.children = [];
    expect(output).toStrictEqual(expected);
  });
  test("Sort children according to order", () => {
    const nodes = {
      a: { parentId: null, id: "a" },
      b: { parentId: "a", order: 1, id: "b" },
      c: { parentId: "a", order: 0, id: "c" },
    };
    const output = nodesApi(createState(nodes)).withAugmentedChildren().state
      .nodes;
    expect(output.a.children[0].id).toBe("c");
    expect(output.a.children[1].id).toBe("b");
  });
});
