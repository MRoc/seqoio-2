import { createStore } from "./store.js";
import { selectNodes, selectDocument } from "../reducers/nodes.js";
import { selectView } from "../reducers/view.js";

describe("createStore", () => {
  test("With selectors can access document", () => {
    const state = createStore().getState();
    const document = selectDocument(state);
    expect(Object.values(document.nodes).length).toBe(1);
  });
  test("With selectors can access nodes", () => {
    const state = createStore().getState();
    const nodes = selectNodes(state);
    expect(Object.values(nodes).length).toBe(1);
  });
  test("With selectors can access view state", () => {
    const state = createStore().getState();
    const viewState = selectView(state);
    expect(viewState.documentState).toBe(0);
  });
});
