import * as R from "ramda";
import {
  TodoState,
  fromEditingTextToData,
  toTodoState,
} from "../model/data.js";
import {
  createNode,
  isRoot,
  isEmpty,
  nodesApi,
  canBeRemoved,
  createState,
} from "../model/nodes.js";
import { withSelectionRequest } from "../model/selection.js";
import * as ActionTypes from "./nodesTypes.js";
import { setViewState } from "./view.js";
import { DocumentState } from "./viewTypes.js";
import { selectDocument, selectSelection } from "../reducers/nodes.js";
import { parseNodes } from "../model/import.js";
import { replaceOp } from "../model/optype.js";

export function executeOp(op, sync = false) {
  return { type: ActionTypes.EXECUTE_OP, payload: { op }, meta: { sync } };
}

export function executeOpWithUndo(op, sync = false) {
  return {
    type: ActionTypes.EXECUTE_OP_WITH_UNDO,
    payload: { op },
    meta: { sync },
  };
}

export function loadInitialDocument(document) {
  return (dispatch) => {
    const op = replaceOp([], document);
    dispatch(executeOp(op, false));
    dispatch(setViewState(DocumentState.READY));
  };
}

export const nodesSetSelection = (node, selectionRequest) => {
  return (dispatch, getState) => {
    const state = getState();
    const document = selectDocument(state);
    const selection = selectSelection(state);
    const nodeId = node ? node.id : null;
    if (selection.id !== nodeId) {
      if (!node) {
        window.getSelection().removeAllRanges();
      }
      const selectionRequestFinal = withSelectionRequest(
        selection.id,
        node,
        selectionRequest
      );
      const op = nodesApi(document)
        .withNodesSelectedId(nodeId, selectionRequestFinal)
        .withNodesRemovedByPredicate(canBeRemoved).apiState.op;

      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesUnselectNode = (node) => {
  return (dispatch, getState) => {
    const selection = selectSelection(getState());
    if (selection.id === node.id) {
      dispatch(nodesSetSelection(null, undefined));
    }
  };
};

export const nodesToggleExpand = (node, includeSiblings) => {
  return (dispatch, getState) => {
    // TODO
    // If Collapse
    //   If has children AND NOT collapsed > Collapse
    //   If has no children OR collapsed > set cursor to parent and collapse
    // If expand
    //   If has children AND is collapsed > Expand
    //   If has children AND is expanded > To to first child that is a node
    let nodes = nodesApi(selectDocument(getState()));
    const id = node.id;
    const nodeActual = nodes.getNodeById(id);
    const isExpanded = !nodeActual.isExpanded;

    if (includeSiblings) {
      for (const sibling of nodes.getSiblings(node)) {
        nodes = nodes.withPathUpdate(sibling.id, ["isExpanded"], isExpanded);
      }
    } else {
      nodes = nodes.withPathUpdate(id, ["isExpanded"], isExpanded);
    }

    dispatch(executeOpWithUndo(nodes.apiState.op, true));
  };
};

export const nodesToggleTodo = (node) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const nodeActual = nodes.getNodeById(node.id);
    const id = node.id;
    const todoState =
      toTodoState(nodeActual) === TodoState.DONE
        ? TodoState.TODO
        : TodoState.DONE;
    const op = nodes.withPathUpdate(id, ["data", "todoState"], todoState)
      .apiState.op;
    dispatch(executeOpWithUndo(op, true));
  };
};

export const nodesSetText = (node, text) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const id = node.id;
    const nodeActual = nodes.getNodeById(id);
    const data = fromEditingTextToData(nodeActual, text);
    if (data !== node.data) {
      const op = nodes.withPathUpdate(id, ["data"], data).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesAdd = (node) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const newNode = createNode();
    if (
      isRoot(node) ||
      (nodes.getChildren(node).length > 0 && node.isExpanded)
    ) {
      // Add as first child
      const root = nodes.getRoot();

      // If parent is empty and would get garbage collected, use parent-of-parent.
      let parent = nodes.getNodeById(node.id);
      if (!isRoot(parent) && isEmpty(parent)) {
        parent = nodes.getNodeById(parent.parentId);
      }

      const op = nodes
        .withPathUpdate(root?.id, ["isExpanded"], true)
        .withNodesRemovedByPredicate(canBeRemoved)
        .withNodesInsertedAsFirstChild(parent, newNode)
        .withNodesSelectedId(newNode.id).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    } else {
      let sibling = nodes.getNodeById(node.id);

      // Allow adding nodes if previous node would get removed because being empty.
      if (isEmpty(sibling)) {
        const previousSibling = nodes.getPreviousSibling(sibling);
        if (!previousSibling) {
          // If sibling would be arbage collected because being empty,
          // we need to find a new sibling. If there is none, add to parent.
          const parent = nodes.getNodeById(sibling.parentId);
          const op = nodes
            .withNodesRemovedByPredicate(canBeRemoved)
            .withNodesInsertedAsFirstChild(parent, newNode)
            .withNodesSelectedId(newNode.id).apiState.op;
          dispatch(executeOpWithUndo(op, true));
          return;
        } else {
          sibling = previousSibling;
        }
      }

      const op = nodes
        .withNodesRemovedByPredicate(canBeRemoved)
        .withNodesInsertedAsSibling(sibling, newNode)
        .withNodesSelectedId(newNode.id).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesPaste = (node, text) => {
  return (dispatch, getState) => {
    let newNodes = nodesApi(createState(parseNodes(text)));
    const nodes = nodesApi(selectDocument(getState()));
    const nodeActual = nodes.getNodeById(node.id);

    if (
      isRoot(nodeActual) &&
      isEmpty(nodeActual) &&
      newNodes.getFiltered(isRoot).length === 1
    ) {
      const lastNodeToInsert = R.last(newNodes.getVisibleNodes());
      const op = nodes
        .withNodesRemoved(nodes.getRoot())
        .withNodesInserted(newNodes.state.nodes)
        .withNodesSelectedId(lastNodeToInsert.id).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    } else {
      const parentId = isRoot(nodeActual) ? nodeActual.id : nodeActual.parentId;
      const parent = nodes.getNodeById(parentId);
      const order = nodes.calculateFirstChildOrder(parent, {});
      const lastNodeToInsert = R.last(newNodes.getVisibleNodes());

      const root = newNodes.getRoot();
      newNodes = newNodes
        .withPathUpdate(root.id, ["parentId"], parentId)
        .withPathUpdate(root.id, ["order"], order)
        .commit().state.nodes;

      const op = nodes
        .withNodesInserted(newNodes)
        .withNodesSelectedId(lastNodeToInsert.id).apiState.op;

      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesDelete = (node, forceDelete) => {
  return (dispatch, getState) => {
    if (!isRoot(node) && (isEmpty(node) || forceDelete)) {
      const nodes = nodesApi(selectDocument(getState()));
      const nodesToRemove = nodes.getNodeAndDescendants(node);
      const nextNode =
        nodes.getNextNode(R.last(nodesToRemove)) ??
        nodes.getPreviousNode(R.head(nodesToRemove));
      const op = nodes
        .withNodesRemoved(node)
        .withNodesSelectedId(nextNode?.id)
        .withNodesRemovedByPredicate(canBeRemoved).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesMovePrevious = (node) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    if (nodes.getPreviousSibling(node)) {
      const previousSibling = nodes.getPreviousSibling(node);
      const op = nodes
        .withNodesSwapped(node, previousSibling)
        .withNodesRemovedByPredicate(canBeRemoved).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesMoveNext = (node) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const nextSibling = nodes.getNextSibling(node);
    if (nextSibling) {
      const op = nodes
        .withNodesSwapped(node, nextSibling)
        .withNodesRemovedByPredicate(canBeRemoved).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesSelectPrevious = (node, selectionRequest) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const previousNode = nodes.getPreviousNode(node);
    if (previousNode) {
      const op = nodes
        .withNodesRemovedByPredicate(canBeRemoved)
        .withNodesSelectedId(previousNode.id, selectionRequest).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesSelectNext = (node, selectionRequest) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const nextNode = nodes.getNextNode(node);
    if (nextNode) {
      const op = nodes
        .withNodesRemovedByPredicate(canBeRemoved)
        .withNodesSelectedId(nextNode.id, selectionRequest).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesSelectFirst = () => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const visibleNodes = nodes.getVisibleNodes();
    const firstNode = R.head(visibleNodes);
    const op = nodes.withNodesSelectedId(firstNode.id).apiState.op;
    dispatch(executeOpWithUndo(op, true));
  };
};

export const nodesSelectLast = () => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    const filter = {
      self: (n) => !canBeRemoved(n),
      children: (n) => n.isExpanded,
    };
    const visibleNodes = nodes.getVisibleNodes(filter);
    const lastNode = R.last(visibleNodes);
    const op = nodes
      .withNodesSelectedId(lastNode.id)
      .withNodesRemovedByPredicate(canBeRemoved).apiState.op;
    dispatch(executeOpWithUndo(op, true));
  };
};

export const nodesIndentIncrease = (node) => {
  return (dispatch, getState) => {
    const nodes = nodesApi(selectDocument(getState()));
    if (nodes.getPreviousSibling(node)) {
      const parent = nodes.getPreviousSibling(node);
      const order = nodes.calculateLastChildOrder(parent);
      const op = nodes
        .withPathUpdate(node.id, ["parentId"], parent.id)
        .withPathUpdate(node.id, ["order"], order).apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const nodesIndentDecrease = (node) => {
  return (dispatch, getState) => {
    let nodes = nodesApi(selectDocument(getState()));
    if (nodes.getParentOfParent(node)) {
      const parent = nodes.getNodeById(node.parentId);
      const nextSiblings = nodes.getNextSiblings(node);
      const order = nodes.calculateSiblingOrders(parent, node)[0];
      nodes = nodes.withPathUpdate(node.id, ["order"], order);
      nodes = nodes.withPathUpdate(node.id, ["parentId"], parent.parentId);
      for (const nextSibling of nextSiblings) {
        nodes = nodes.withPathUpdate(nextSibling.id, ["parentId"], node.id);
      }
      const op = nodes.apiState.op;
      dispatch(executeOpWithUndo(op, true));
    }
  };
};

export const shortcutBindings = [
  {
    key: "Escape",
    modifiers: [],
    action: nodesUnselectNode,
    passDefault: true,
  },
  { key: "Enter", modifiers: [], action: nodesAdd },
  {
    key: "Delete",
    modifiers: [],
    action: nodesDelete,
    isReady: (_, node) => isEmpty(node),
  },
  {
    key: "ArrowUp",
    modifiers: ["Alt"],
    action: nodesMovePrevious,
  },
  {
    key: "ArrowUp",
    modifiers: [],
    action: nodesSelectPrevious,
    isReady: (e, _) => {
      return e.caretLine === 0;
    },
  },
  {
    key: "ArrowDown",
    modifiers: ["Alt"],
    action: nodesMoveNext,
  },
  {
    key: "ArrowDown",
    modifiers: [],
    action: nodesSelectNext,
    isReady: (e, _) => {
      return e.caretLine === e.lineCount - 1;
    },
  },
  {
    key: "ArrowLeft",
    modifiers: ["Alt"],
    action: nodesToggleExpand,
  },
  {
    key: "ArrowRight",
    modifiers: ["Alt"],
    action: nodesToggleExpand,
  },
  {
    key: "Tab",
    modifiers: ["Shift"],
    action: nodesIndentDecrease,
  },
  {
    key: "Tab",
    modifiers: [],
    action: nodesIndentIncrease,
  },
  {
    key: "Home",
    modifiers: ["Control"],
    action: nodesSelectFirst,
  },
  {
    key: "End",
    modifiers: ["Control"],
    action: nodesSelectLast,
  },
];
