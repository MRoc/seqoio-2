import {
  createNode,
  createSelection,
  emptySelection,
  nodesApi,
} from "../model/nodes.js";
import { createData, TodoState, toText, toTodoState } from "../model/data.js";
import * as ActionsNodes from "../actions/nodes.js";
import * as ActionsHistory from "../actions/history.js";
import { selectDocument } from "../reducers/nodes.js";
import { parseNodes } from "../model/import.js";
import { toFormattedText } from "../model/export.js";
import { testStore } from "./testStore.js";
jest.mock("../api/sharedb.js");

describe("Actions", () => {
  describe("Undo/redo", () => {
    test("Undo/redo last text edits", () => {
      const store = fromString("A");

      expect(toText(store.node(0))).toStrictEqual("A");

      store.dispatch(ActionsNodes.nodesSetText({ id: store.node(0).id }, "B"));

      expect(toText(store.node(0))).toStrictEqual("B");

      store.dispatch(ActionsHistory.undo());

      expect(toText(store.node(0))).toStrictEqual("A");

      store.dispatch(ActionsHistory.redo());

      expect(toText(store.node(0))).toStrictEqual("B");
    });
    test("Undo/redo delete", () => {
      const store = fromString("- A\n  - B\n  - C");

      store.dispatch(ActionsNodes.nodesDelete(store.node(1), true));

      expect(toString(store)).toBe("- A\n  - C");

      store.dispatch(ActionsHistory.undo());

      expect(toString(store)).toBe("- A\n  - B\n  - C");
    });
  });
  describe("nodesSetSelection", () => {
    test("Set state selection to node id", () => {
      const store = testStore(
        [createNode("a", null, 0, true, createData("A"))],
        emptySelection()
      );
      store.dispatch(ActionsNodes.nodesSetSelection(store.node(0)));
      expect(store.selection().id).toBe("a");
    });
    test("Set state selection to null and removes focus", () => {
      const selection = {
        removeAllRanges: jest.fn(),
      };
      window.getSelection = () => selection;
      const store = testStore(
        [createNode("a", null, 0, true, createData("A"))],
        createSelection("a")
      );
      expect(store.selection().id).toBe("a");
      store.dispatch(ActionsNodes.nodesSetSelection(null));
      expect(store.selection().id).toBe(null);
      expect(selection.removeAllRanges.mock.calls.length).toBe(1);
    });
  });
  describe("nodesUnselectNode", () => {
    test("When node selected set selection to null", () => {
      const store = testStore(
        [createNode("a", null, 0, true, createData("A"))],
        createSelection("a")
      );
      store.dispatch(ActionsNodes.nodesUnselectNode(store.node(0)));
      expect(store.selection().id).toBe(null);
    });
    test("When not selected does nothing", () => {
      const store = testStore(
        [createNode("a", null, 0, true, createData("A"))],
        createSelection("5")
      );
      store.dispatch(ActionsNodes.nodesUnselectNode(store.node(0)));
      expect(store.selection().id).toBe("5");
    });
  });
  describe("nodesToggleExpand", () => {
    test("Toggle isExpanded from false to true", () => {
      const store = fromString("+ A\n  - B");
      store.dispatch(ActionsNodes.nodesToggleExpand(store.node(0)));
      expect(toString(store)).toBe("- A\n  - B");
    });
    test("Toggle isExpanded from true to false", () => {
      const store = fromString("- A\n  - B");
      store.dispatch(ActionsNodes.nodesToggleExpand(store.node(0)));
      expect(toString(store)).toBe("+ A\n  - B");
    });
    test("Toggle isExpanded from false to true including siblings", () => {
      const store = fromString("- A\n  + B\n  + C");
      store.dispatch(ActionsNodes.nodesToggleExpand(store.node(1), true));
      expect(toString(store)).toBe("- A\n  - B\n  - C");
    });
  });
  describe("nodesToggleTodo", () => {
    test("Toggle from TODO to DONE", () => {
      const store = fromString("[ ] A");
      store.dispatch(ActionsNodes.nodesToggleTodo(store.node(0)));
      expect(toString(store)).toBe("[X] A");
    });
    test("Toggle from DONE to TODO", () => {
      const store = fromString("[X] A");
      store.dispatch(ActionsNodes.nodesToggleTodo(store.node(0)));
      expect(toString(store)).toBe("[ ] A");
    });
  });
  describe("nodesSetText", () => {
    test("Set text of node", () => {
      const store = fromString("- ");
      store.dispatch(ActionsNodes.nodesSetText(store.node(0), "A"));
      expect(toText(store.node(0))).toBe("A");
      expect(toTodoState(store.node(0))).toBe(TodoState.NONE);
    });
    test("Text with TODO state", () => {
      const store = fromString("- ");
      store.dispatch(ActionsNodes.nodesSetText(store.node(0), "[ ] A"));
      expect(toText(store.node(0))).toBe("A");
      expect(toTodoState(store.node(0))).toBe(TodoState.TODO);
    });
    test("Text with DONE state", () => {
      const store = fromString("- A");
      store.dispatch(ActionsNodes.nodesSetText(store.node(0), "[X] A"));
      expect(toText(store.node(0))).toBe("A");
      expect(toTodoState(store.node(0))).toBe(TodoState.DONE);
    });
  });
  describe("nodesAdd", () => {
    test("Add to root adds child", () => {
      const store = fromString("- A");
      store.dispatch(ActionsNodes.nodesAdd(store.node(0)));
      expect(toString(store)).toBe("- A\n  - ");
      expect(toText(store.selectedNode())).toBe("");
    });
    test("Add to expanded node with children adds as first child", () => {
      const store = fromString("- A\n  - B\n    - C");
      store.dispatch(ActionsNodes.nodesAdd(store.node(1)));
      expect(toString(store)).toBe("- A\n  - B\n    - \n    - C");
      expect(toText(store.selectedNode())).toBe("");
    });
    test("Add to expanded node without children adds sibling", () => {
      const store = fromString("- A\n  - B");
      store.dispatch(ActionsNodes.nodesAdd(store.node(1)));
      expect(toString(store)).toBe("- A\n  - B\n  - ");
      expect(toText(store.selectedNode())).toBe("");
    });
    test("Add to collapsed node with children adds sibling", () => {
      const store = fromString("- A\n  + B\n    - C");
      store.dispatch(ActionsNodes.nodesAdd(store.node(1)));
      expect(toString(store)).toBe("- A\n  + B\n    - C\n  - ");
      expect(toText(store.selectedNode())).toBe("");
    });
    test("Add to empty node that has sibling", () => {
      const store = fromString("- A\n  - \n  - C");
      store.dispatch(ActionsNodes.nodesAdd(store.node(1)));
      expect(toString(store)).toBe("- A\n  - \n  - C");
      expect(toText(store.selectedNode())).toBe("");
    });
  });
  describe("nodesPaste", () => {
    test("Paste single root into empty root replaces complete state", () => {
      const store = fromString("- ");
      store.dispatch(ActionsNodes.nodesPaste(store.node(0), "- B"));
      expect(toString(store)).toBe("B");
    });
    test("Paste tree into empty root replaces complete state", () => {
      const store = fromString("- ");
      store.dispatch(ActionsNodes.nodesPaste(store.node(0), "- B\n  - C"));
      expect(toString(store)).toBe("- B\n  - C");
    });
    test("Paste single root into root adds to root", () => {
      const store = fromString("- A");
      store.dispatch(ActionsNodes.nodesPaste(store.node(0), "- B\r\n  - C"));
      expect(toString(store)).toBe("- A\n  - B\n    - C");
    });
    test("Paste single root into node (not root) adds as sibling", () => {
      const store = fromString("- A\n  - B");
      store.dispatch(ActionsNodes.nodesPaste(store.node(1), "- C\n  - D"));
      expect(toString(store)).toBe("- A\n  - C\n    - D\n  - B");
    });
  });
  describe("nodesDelete", () => {
    test("With node deletes node and descendants and moves selection behind", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D\n    - E");
      store.dispatch(ActionsNodes.nodesDelete(store.node(1), true));
      expect(toString(store)).toBe("- A\n  - D\n    - E");
      expect(toText(store.selectedNode())).toBe("D");
    });
    test("With node deletes node and descendants and moves selection before", () => {
      const store = fromString("- A\n  - B\n    - C");
      store.dispatch(ActionsNodes.nodesDelete(store.node(1), true));
      expect(toString(store)).toBe("A");
      expect(toText(store.selectedNode())).toBe("A");
    });
  });
  describe("nodesMovePrevious", () => {
    test("With previous sibling switches with sibling", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D\n    - E");
      store.dispatch(ActionsNodes.nodesMovePrevious(store.node(3)));
      expect(toString(store)).toBe("- A\n  - D\n    - E\n  - B\n    - C");
    });
    test("With no previous sibling does nothing", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D\n    - E");
      store.dispatch(ActionsNodes.nodesMovePrevious(store.node(1)));
      expect(toString(store)).toBe("- A\n  - B\n    - C\n  - D\n    - E");
    });
  });
  describe("nodesMoveNext", () => {
    test("With next sibling switches with sibling", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D\n    - E");
      store.dispatch(ActionsNodes.nodesMoveNext(store.node(1)));
      expect(toString(store)).toBe("- A\n  - D\n    - E\n  - B\n    - C");
    });
    test("With no next sibling does nothing", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D\n    - E");
      store.dispatch(ActionsNodes.nodesMoveNext(store.node(3)));
      expect(toString(store)).toBe("- A\n  - B\n    - C\n  - D\n    - E");
    });
  });
  describe("nodesSelectPrevious", () => {
    test("With previous being a direct sibling", () => {
      const store = fromString("- A\n  - B\n  - C");
      store.dispatch(ActionsNodes.nodesSelectPrevious(store.node(2)));
      expect(toText(store.selectedNode())).toBe("B");
    });
    test("With previous being a collapsed sibling", () => {
      const store = fromString("- A\n  + B\n    - C\n  - D");
      store.dispatch(ActionsNodes.nodesSelectPrevious(store.node(3)));
      expect(toText(store.selectedNode())).toBe("B");
    });
    test("With previous being a parent", () => {
      const store = fromString("- A\n  - B");
      store.dispatch(ActionsNodes.nodesSelectPrevious(store.node(1)));
      expect(toText(store.selectedNode())).toBe("A");
    });
  });
  describe("nodesSelectNext", () => {
    test("With next being a direct sibling", () => {
      const store = fromString("- A\n  - B\n  - C");
      store.dispatch(ActionsNodes.nodesSelectNext(store.node(1)));
      expect(toText(store.selectedNode())).toBe("C");
    });
    test("With next being a expanded child", () => {
      const store = fromString("- A\n  - B\n    - C");
      store.dispatch(ActionsNodes.nodesSelectNext(store.node(1)));
      expect(toText(store.selectedNode())).toBe("C");
    });
    test("With next being a collapsed child", () => {
      const store = fromString("- A\n  + B\n    - C\n  - D");
      store.dispatch(ActionsNodes.nodesSelectNext(store.node(1)));
      expect(toText(store.selectedNode())).toBe("D");
    });
  });
  describe("nodesSelectFirst", () => {
    test("With nodes selects first", () => {
      const store = fromString("- A\n  - B\n  - C");
      store.dispatch(ActionsNodes.nodesSelectFirst());
      expect(toText(store.selectedNode())).toBe("A");
    });
  });
  describe("nodesSelectLast", () => {
    test("With nodes selects last", () => {
      const store = fromString("- A\n  - B");
      store.dispatch(ActionsNodes.nodesSelectLast());
      expect(toText(store.selectedNode())).toBe("B");
    });
    test("With last node being hidden, selects last visible", () => {
      const store = fromString("- A\n  + B\n    - C");
      store.dispatch(ActionsNodes.nodesSelectLast());
      expect(toText(store.selectedNode())).toBe("B");
    });
    test("With last node empty", () => {
      const store = fromString("- A\n  - B\n    - ");
      store.dispatch(ActionsNodes.nodesSelectLast());
      expect(toString(store)).toBe("- A\n  - B");
      expect(toText(store.selectedNode())).toBe("B");
    });
  });
  describe("nodesIndentIncrease", () => {
    test("With node being first child does nothing", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D\n    - E");
      store.dispatch(ActionsNodes.nodesIndentIncrease(store.node(1)));
      expect(toString(store)).toBe("- A\n  - B\n    - C\n  - D\n    - E");
    });
    test("With node being having a previous sibling makes makes it a child", () => {
      const store = fromString("- A\n  - B\n  - C\n  - D");
      store.dispatch(ActionsNodes.nodesIndentIncrease(store.node(2)));
      expect(toString(store)).toBe("- A\n  - B\n    - C\n  - D");
    });
    test("With childrens also moves these", () => {
      const store = fromString("- A\n  - B\n  - C\n    - D");
      store.dispatch(ActionsNodes.nodesIndentIncrease(store.node(2)));
      expect(toString(store)).toBe("- A\n  - B\n    - C\n      - D");
    });
  });
  describe("nodesIndentDecrease", () => {
    test("With no parent of parent does nothing", () => {
      const store = fromString("- A\n  - B\n  - C\n  - D");
      store.dispatch(ActionsNodes.nodesIndentDecrease(store.node(2)));
      expect(toString(store)).toBe("- A\n  - B\n  - C\n  - D");
    });
    test("With parent of parent makes this new parent", () => {
      const store = fromString("- A\n  - B\n    - C\n  - D");
      store.dispatch(ActionsNodes.nodesIndentDecrease(store.node(2)));
      expect(toString(store)).toBe("- A\n  - B\n  - C\n  - D");
    });
  });

  function toString(store) {
    const state = selectDocument(store.getState());
    const api = nodesApi(state).withAugmentedChildren();
    const result = toFormattedText(api.state.nodes, api.getRoot(), "  ");
    return result;
  }

  function fromString(text) {
    return testStore(parseNodes(text), emptySelection());
  }
});
