import { combineReducers } from "@reduxjs/toolkit";
import { nodesReducer } from "./nodes.js";
import { historyReducer } from "./history.js";
import { viewReducer } from "./view.js";

export const reducer = combineReducers({
  document: nodesReducer,
  history: historyReducer,
  view: viewReducer,
});
