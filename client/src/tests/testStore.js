import * as ActionTypes from "../actions/nodesTypes.js";
import { type, replaceOp } from "../model/optype.js";
import { createStore } from "../stores/store.js";
import { selectNodes, selectSelection } from "../reducers/nodes.js";
import { TestDocument } from "./testDocument.js";
import {
  arrayToNodeSet,
  iterateAugumentedNodes,
  nodesApi,
} from "../model/nodes.js";

export function testStore(nodes, selection) {
  nodes = arrayToNodeSet(nodes);
  const document = new TestDocument(type, { nodes, selection });
  const connection = {
    doc: document,
    promise: Promise.resolve({}),
    connection: {
      on: function () {},
    },
  };
  const store = createStore(connection);
  store.nodes = () => {
    return selectNodes(store.getState());
  };
  store.selection = () => {
    return selectSelection(store.getState());
  };
  store.selectedNode = () => {
    const selection = store.selection();
    return Object.values(store.nodes()).find((n) => n.id === selection.id);
  };
  store.node = (index) => {
    const api = nodesApi({ nodes: store.nodes() }).withAugmentedChildren();
    const nodes = [...iterateAugumentedNodes(api.getRoot())];
    return nodes[index];
  };
  store.dispatch({
    type: ActionTypes.EXECUTE_OP,
    payload: { op: replaceOp(["nodes"], nodes) },
    meta: { sync: false },
  });
  if (selection) {
    store.dispatch({
      type: ActionTypes.EXECUTE_OP,
      payload: {
        op: replaceOp(["selection"], {
          id: selection.id,
          selectionRequest: null,
        }),
      },
      meta: { sync: false },
    });
  }
  return store;
}
