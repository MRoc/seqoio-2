import { createData } from "../model/data.js";
import { createNode, createState, emptySelection } from "../model/nodes.js";
import {
  nodesReducer,
  selectDocument,
  selectNodes,
  selectAugumentedNodes,
} from "./nodes.js";
import { createStore } from "../stores/store.js";
import * as ActionTypes from "../actions/nodesTypes.js";

describe("nodesReducer", () => {
  test("With no state and unknown action", () => {
    const state = [];
    const action = { type: "" };
    const newState = nodesReducer(state, action);
    expect(newState).toStrictEqual([]);
  });
  describe("nodes/undo", () => {
    test("Undo last operation", () => {
      const state = createState(
        [createNode(0, null, 0, true, createData("A"))],
        emptySelection()
      );
      const action = {
        type: ActionTypes.UNDO,
      };
      const newState = nodesReducer(state, action);
      expect(newState.nodes[0].data.text).toStrictEqual("A");
    });
  });
  test("Select document", () => {
    const state = createStore().getState();
    const document = selectDocument(state);
    expect(document).toStrictEqual(state.document);
  });
  test("Select nodes", () => {
    const state = createStore().getState();
    const nodes = selectNodes(state);
    expect(nodes).toStrictEqual(state.document.nodes);
  });
  test("Select augumented nodes", () => {
    const state = createStore().getState();
    const nodes = selectAugumentedNodes(state);
    expect(Object.values(nodes).length).toBe(1);
  });
});
