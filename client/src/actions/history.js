import * as ActionTypes from "./historyTypes.js";
import { history } from "../model/history.js";
import { selectHistory } from "../reducers/history.js";
import { type } from "../model/optype.js";

export const undo = () => {
  return (dispatch, getState) => {
    const state = selectHistory(getState());
    const api = history(type, state);
    if (api.hasUndo()) {
      dispatch({ type: ActionTypes.UNDO });
    }
  };
};

export const redo = () => {
  return (dispatch, getState) => {
    const state = selectHistory(getState());
    const api = history(type, state);
    if (api.hasRedo()) {
      dispatch({ type: ActionTypes.REDO });
    }
  };
};
