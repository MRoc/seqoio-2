import { viewReducer } from "./view.js";
import { DocumentState, SET_DOCUMENT_STATE } from "../actions/viewTypes.js";

describe("viewReducer", () => {
  test("With no state and unknown action", () => {
    const state = [];
    const action = { type: "" };
    const newState = viewReducer(state, action);
    expect(newState).toStrictEqual([]);
  });
  test("view/setDocumentState", () => {
    const state = { documentState: DocumentState.NONE };
    const action = {
      type: SET_DOCUMENT_STATE,
      payload: { state: DocumentState.LOADING },
    };
    const newState = viewReducer(state, action);
    expect(newState).toStrictEqual({
      documentState: DocumentState.LOADING,
    });
  });
});
