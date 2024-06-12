import * as ActionTypes from "./viewTypes.js";

export const setViewState = (documentState) => {
  return {
    type: ActionTypes.SET_DOCUMENT_STATE,
    payload: { state: documentState },
  };
};

export const setFatalError = (message) => {
  return {
    type: ActionTypes.SET_FATAL_ERROR,
    payload: { message: message },
  };
};
