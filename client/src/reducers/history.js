import * as ActionTypes from "../actions/historyTypes.js";
import { defaultHistory } from "../model/history.js";

export const historyReducer = function (state = defaultHistory(), action) {
  switch (action.type) {
    case ActionTypes.HISTORY:
      return action.payload.state;
    case ActionTypes.UNDO:
    case ActionTypes.REDO:
    default:
      return state;
  }
};

export const selectHistory = (state) => state.history;
