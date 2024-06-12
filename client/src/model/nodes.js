import { v4 } from "uuid";
import { getValue } from "@mroc/patcher";
import { type, removeOp, insertOp, replaceOp } from "./optype.js";
import { validate } from "../library/validate.js";

export function createNode(
  id = null,
  parentId = null,
  order = -1,
  isExpanded = true,
  data = undefined
) {
  if (id && !(typeof id === "string")) {
    throw new Error(`ID must be string to be suitable as key for sets!`);
  }
  return {
    id: id ?? v4(),
    parentId: parentId,
    order: order,
    isExpanded: isExpanded,
    data: data,
  };
}

export function isRoot(node) {
  validate(node, "object");
  return node.parentId === null;
}

export function isEmpty(node) {
  validate(node, "object");
  return !node.data || node.data.text === "";
}

export function canBeRemoved(node) {
  return !isRoot(node) && isEmpty(node);
}

export function withNodeParentId(node, parentId) {
  validate(node, "object");
  return { ...node, parentId: parentId };
}

export function withNodeOrder(node, order) {
  validate(node, "object");
  return { ...node, order: order };
}

export function withNodeIsExpanded(node, isExpanded) {
  validate(node, "object");
  return { ...node, isExpanded: isExpanded };
}

export function withNodeData(node, data) {
  validate(node, "object");
  return { ...node, data: data };
}

export function createState(nodes, selection) {
  return {
    nodes: arrayToNodeSet(nodes) || defaultNodes(),
    selection: selection || emptySelection(),
  };
}

export function createSelection(id, request) {
  return {
    id: id,
    request: request || null,
  };
}

export function defaultNodes() {
  return arrayToNodeSet([createNode()]);
}

export function emptySelection() {
  return { id: null, request: null };
}

export function nodesApi(state, apiState) {
  validate(state, "object");
  validate(state.nodes, "object");
  if (Array.isArray(state.nodes)) {
    state = { ...state, nodes: arrayToNodeSet(state.nodes) };
  }
  const internalApi = {
    state,
    apiState: apiState || { modified: false, op: undefined },
    getRoot: function () {
      return nodeSetToArray(this.state.nodes).filter((n) => isRoot(n))[0];
    },
    getNodeById: function (id) {
      if (id === undefined) {
        throw new Error(`Cannot look up for undefined ID!`);
      }
      validate(id, "string");
      return this.state.nodes[id];
    },
    getFiltered: function (predicate) {
      return nodeSetToArray(this.state.nodes).filter((n) => predicate(n));
    },
    getChildren: function (node) {
      validate(node, "object");
      return nodeSetToArray(this.state.nodes)
        .filter((n) => n.parentId === node.id)
        .sort((a, b) => a.order - b.order);
    },
    getSiblings: function (node) {
      validate(node, "object");
      return nodeSetToArray(this.state.nodes)
        .filter((n) => n.parentId === node.parentId)
        .sort((a, b) => a.order - b.order);
    },
    getPathToRoot: function* (node) {
      validate(node, "object");
      let p = node;
      while (p && p.parentId !== null) {
        p = this.getNodeById(p.parentId);
        yield p;
      }
    },
    getIndentation: function (node) {
      validate(node, "object");
      return [...this.getPathToRoot(node)].length;
    },
    getParentOfParent: function (node) {
      validate(node, "object");
      return [...this.getPathToRoot(node)][1];
    },
    getVisibleNodes: function (filter = filterHidden) {
      const augumentedRoot = this.withAugmentedChildren().getRoot();
      const result = [...iterateAugumentedNodes(augumentedRoot, filter, true)];
      return result.map((n) => this.getNodeById(n.id));
    },
    getDescendants: function (node, includeSelf = false) {
      validate(node, "object");
      const augumentedNode = this.withAugmentedChildren().getNodeById(node.id);
      const result = [
        ...iterateAugumentedNodes(augumentedNode, filterNone, includeSelf),
      ];
      return result.map((n) => this.getNodeById(n.id));
    },
    getNodeAndDescendants: function (node) {
      validate(node, "object");
      return this.getDescendants(node, true);
    },
    getPreviousSibling: function (node) {
      validate(node, "object");
      const s = this.getSiblings(node);
      const index = s.findIndex((n) => n.id === node.id);
      if (index > 0) {
        return s[index - 1];
      }
      return null;
    },
    getNextSibling: function (node) {
      validate(node, "object");

      const s = this.getSiblings(node);
      const index = s.findIndex((n) => n.id === node.id);
      if (index < s.length - 1) {
        return s[index + 1];
      }
      return null;
    },
    getNextSiblings: function (node) {
      validate(node, "object");

      const s = this.getSiblings(node);
      const index = s.findIndex((n) => n.id === node.id);
      return s.slice(index + 1);
    },
    getPreviousNode: function (node) {
      validate(node, "object");
      const nodes = this.getVisibleNodes();
      const index = nodes.findIndex((n) => node.id === n.id);
      if (index >= 0 && index > 0) {
        return nodes[index - 1];
      }
      return null;
    },
    getNextNode: function (node) {
      validate(node, "object");
      const nodes = this.getVisibleNodes();
      const index = nodes.findIndex((n) => node.id === n.id);
      if (index >= 0 && index < nodes.length - 1) {
        return nodes[index + 1];
      }
      return null;
    },
    withOp: function (operation) {
      const ops = this.apiState.op
        ? type.compose(this.apiState.op, operation)
        : operation;
      const newApiState = {
        ...this.apiState,
        op: ops,
      };
      return nodesApi(this.state, newApiState);
    },
    commit: function () {
      // NOTE: Transactions should be initiated here as it's the first time
      //       a new nodesApi() fluent API is starting to transform state.
      //       When that happens, future (undone) operations from history
      //       must be discarded and a new transaction starts.
      //
      const op = this.apiState.op;
      if (op) {
        return nodesApi(type.apply(this.state, op), apiState);
      } else {
        return this;
      }
    },
    withNodesSelectedId: function (selectedId, selectionRequest) {
      const value = createSelection(selectedId, selectionRequest);
      const operation = this.state.selection
        ? replaceOp(["selection"], value)
        : insertOp(["selection"], value);
      return this.withOp(operation);
    },
    withPathUpdate: function (id, path, value) {
      if (id === undefined) {
        return this;
      }

      const node = this.getNodeById(id);

      const currentValue = getValue(node, path);
      if (currentValue === value) {
        return this;
      }

      const exists = currentValue !== undefined;
      const operation = exists
        ? replaceOp(["nodes", id, ...path], value)
        : insertOp(["nodes", id, ...path], value);
      return this.withOp(operation);
    },
    withNewRootId: function (parentId) {
      const operations = nodeSetToArray(this.state.nodes)
        .filter((n) => isRoot(n))
        .map((n) => replaceOp(["nodes", n.id, "parentId"], parentId))
        .reduce((op1, op2) => type.compose(op1, op2));
      return this.withOp(operations);
    },
    calculateFirstChildOrder: function (parentNode, node) {
      if (!Array.isArray(node)) {
        node = [node];
      }
      const children = this.getChildren(parentNode);
      return children.length > 0 ? children[0].order - node.length : 0;
    },
    calculateLastChildOrder: function (parentNode) {
      return this.getChildren(parentNode).length;
    },
    calculateSiblingOrders: function (sibling, node) {
      if (!Array.isArray(node)) {
        node = [node];
      }
      const parent = this.getNodeById(sibling.parentId);
      const children = this.getChildren(parent);
      const index0 = children.findIndex((n) => sibling.id === n.id);
      const index1 = children.length > index0 + 1 ? index0 + 1 : -1;
      const order0 = children[index0].order;
      const delta =
        index1 >= 0
          ? (children[index1].order - order0) / (node.length + 1)
          : 1.0;
      return node.map((_, i) => order0 + delta * (1 + i));
    },
    withNodesInsertedAsFirstChild: function (parentNode, node) {
      if (!Array.isArray(node)) {
        node = [node];
      }
      const order = this.calculateFirstChildOrder(parentNode, node);

      const nodes = node.map((n, i) => {
        return { ...n, parentId: parentNode.id, order: order + i };
      });

      return this.withNodesInserted(nodes);
    },
    withNodesInsertedAsSibling: function (sibling, node) {
      if (!Array.isArray(node)) {
        node = [node];
      }
      const order = this.calculateSiblingOrders(sibling, node);
      node = node.map((n, i) => {
        return {
          ...n,
          order: order[i],
          parentId: sibling.parentId,
        };
      });
      return this.withNodesInserted(node);
    },
    withNodesInserted: function (node) {
      if (!Array.isArray(node)) {
        node = nodeSetToArray(node);
      }
      const operation = node
        .map((n) => insertOp(["nodes", n.id], n))
        .reduce((op1, op2) => type.compose(op1, op2));
      return this.withOp(operation);
    },
    withNodesRemovedByPredicate: function (predicate) {
      const nodesToRemove = nodeSetToArray(this.state.nodes).filter(predicate);

      if (nodesToRemove.length !== 0) {
        return this.withNodesRemoved(nodesToRemove);
      }

      return this;
    },
    withNodesRemoved: function (nodesToRemove) {
      if (!Array.isArray(nodesToRemove)) {
        nodesToRemove = [nodesToRemove];
      }

      const allNodesToRemove = nodesToRemove.flatMap((n) =>
        this.getNodeAndDescendants(n)
      );

      let nodes = this;

      const needToResetSelection =
        this.state.selection &&
        allNodesToRemove.map((n) => n.id).includes(this.state.selection.id);
      if (needToResetSelection) {
        nodes = nodes.withNodesSelectedId(null, null);
      }

      const operations = allNodesToRemove
        .map((n) => removeOp(["nodes", n.id], n.node))
        .reduce((op1, op2) => type.compose(op1, op2));

      return nodes.withOp(operations);
    },
    withNodesSwapped: function (a, b) {
      validate(a, "object");
      validate(b, "object");
      const order0 = this.state.nodes[a.id].order;
      const order1 = this.state.nodes[b.id].order;
      const operations = [
        replaceOp(["nodes", a.id, "order"], order1),
        replaceOp(["nodes", b.id, "order"], order0),
      ].reduce((op1, op2) => type.compose(op1, op2));
      return this.withOp(operations);
    },
    withAugmentedChildren: function (
      includeSelection = false,
      augumenters = []
    ) {
      const augumentedNodes = nodeSetToArray(this.state.nodes).map((n) => {
        return { ...n, hasFocus: false, children: [] };
      });

      const map = {};
      for (const augumentedNode of augumentedNodes) {
        map[augumentedNode.id] = augumentedNode;
      }

      for (const augumentedNode of augumentedNodes) {
        if (!isRoot(augumentedNode)) {
          map[augumentedNode.parentId].children.push(augumentedNode);
        }
      }

      for (const augumentedNode of augumentedNodes) {
        augumentedNode.children.sort((a, b) => a.order - b.order);
      }

      for (const augumenter of augumenters) {
        augumenter(augumentedNodes);
      }

      if (
        includeSelection &&
        this.state.selection &&
        this.state.selection.id !== null &&
        this.state.selection.id in map
      ) {
        const id = this.state.selection.id;
        map[id].hasFocus = true;
        map[id].selectionRequest = this.state.selection.request;
      }

      return nodesApi(
        {
          ...this.state,
          nodes: arrayToNodeSet(augumentedNodes),
        },
        this.apiState
      );
    },
  };

  return internalApi;
}

export function* iterateAugumentedNodes(
  node,
  filter = filterNone,
  includeSelf = true
) {
  validate(node, "object");

  if (filter.self(node)) {
    if (includeSelf) {
      yield node;
    }
    if (filter.children(node)) {
      for (const child of node.children) {
        yield* iterateAugumentedNodes(child, filter, true);
      }
    }
  }
}

export const filterHidden = {
  self: function (n) {
    return true;
  },
  children: function (n) {
    return n.isExpanded;
  },
};

export const filterNone = {
  self: (n) => true,
  children: (n) => true,
};

export function arrayToNodeSet(nodes) {
  if (Array.isArray(nodes)) {
    const tmp = {};
    for (const node of nodes) {
      tmp[node.id] = node;
    }
    nodes = tmp;
  }
  return nodes;
}

export function nodeSetToArray(nodes) {
  for (const [key, value] of Object.entries(nodes)) {
    if (key !== value.id) {
      throw new Error(`It seems the provided nodes are no node-set!`);
    }
  }
  return Object.values(nodes);
}
