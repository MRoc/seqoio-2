import {
  DocumentState,
  SET_DOCUMENT_STATE,
  SET_FATAL_ERROR,
} from "../actions/viewTypes.js";

const initialState = {
  documentState: DocumentState.NONE,
  message: undefined,
};

export const viewReducer = function (state = initialState, action) {
  switch (action.type) {
    case SET_DOCUMENT_STATE:
      return { ...state, documentState: action.payload.state };
    case SET_FATAL_ERROR:
      return {
        ...state,
        documentState: DocumentState.ERROR,
        message: { text: action.payload.message, success: false },
      };
    default:
      return state;
  }
};

export const selectView = (state) => state.view;
