import { createSelector } from "reselect";
import { createState, nodesApi } from "../model/nodes.js";
import * as ActionTypes from "../actions/nodesTypes.js";
import { todoStateAugumenter } from "../model/data.js";
import { type } from "../model/optype.js";

const initialState = createState();

// Actions MUST evaluate UI state, not reducer!
// Reducer MUST keep a consistent state independent of actions!
// Reducer MUST NOT use any property except node.ID from incoming actions except for add!

export const nodesReducer = function (state = initialState, action) {
  switch (action.type) {
    case ActionTypes.EXECUTE_OP:
    case ActionTypes.EXECUTE_OP_WITH_UNDO: {
      return type.apply(state, action.payload.op);
    }
    default:
      return state;
  }
};

export const selectDocument = (state) => state.document;

export const selectNodes = (state) => state.document.nodes;

export const selectSelection = (state) => state.document.selection;

export const selectAugumentedNodes = createSelector(
  selectDocument,
  (document) =>
    nodesApi(document).withAugmentedChildren(true, [todoStateAugumenter]).state
      .nodes
);
