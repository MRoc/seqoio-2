import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Canvas from "./Canvas";
import LoadingScreen from "./LoadingScreen";
import "./App.scss";
import {
  nodesSelectPrevious,
  nodesSelectNext,
  nodesSetSelection,
  nodesUnselectNode,
  nodesToggleExpand,
  nodesToggleTodo,
  nodesSetText,
  nodesDelete,
  nodesPaste,
  shortcutBindings as nodesShortcutBindings,
} from "../actions/nodes.js";
import { shortcutBindings as undoShortcutBindings } from "../actions/undo.js";
import { DocumentState } from "../actions/viewTypes.js";
import { toFormattedText } from "../model/export.js";
import { selectNodes } from "../reducers/nodes.js";
import { selectView } from "../reducers/view.js";
import {
  handleShortcut,
  useGlobalShortcuts,
  isShortcutPressed,
} from "redux-min-shortcuts";
import { getClipboardText, setClipboardText } from "../library/clipboard.js";
import { caretByPosition, caretByIndex } from "@mroc/react-div-contenteditable";

function App() {
  const dispatch = useDispatch();
  const nodes = useSelector(selectNodes);
  const view = useSelector(selectView);

  const handleCopyImpl = (event, node, deleteNode) => {
    // If there is a text selection in window, do nothing.
    // This allows the user to copy paste selected text.
    if (window.getSelection().toString().length !== 0) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const text = toFormattedText(nodes, node);
    setClipboardText(text);

    if (deleteNode) {
      dispatch(nodesDelete(node, true));
    }
  };

  const handleNodeClick = (event, node) => {
    event.stopPropagation();
    dispatch(nodesSetSelection(node, caretByIndex(event.selection)));
  };

  const handleNodeFocusLost = (event, node) => {
    event.stopPropagation();
    dispatch(nodesUnselectNode(node));
  };

  const handleNodeChange = (event, node) => {
    event.stopPropagation();
    dispatch(nodesSetText(node, event.target.innerText));
  };

  const handleNodeToggleExpand = (event, node) => {
    event.stopPropagation();
    const includeSiblings = event.altKey;
    dispatch(nodesToggleExpand(node, includeSiblings));
  };

  const handleNodeToggleTodo = (event, node) => {
    event.stopPropagation();
    dispatch(nodesToggleTodo(node));
  };

  const handleCopy = (event, node) => {
    handleCopyImpl(event, node, false);
  };

  const handleCut = (event, node) => {
    handleCopyImpl(event, node, true);
  };

  const handlePaste = (event, node) => {
    const text = getClipboardText(event);

    // If there is a single line text pasted, do nothing.
    // This allows the user to copy paste selected text.
    if (!text || !text.includes("\n")) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    dispatch(nodesPaste(node, text));
  };

  const arrowUp = { key: "ArrowUp", modifiers: [] };
  const arrowDown = { key: "ArrowDown", modifiers: [] };

  const handleNodeKeyDown = (event, node) => {
    if (isShortcutPressed(event, arrowUp) && event.caretLine === 0) {
      event.preventDefault();
      event.stopPropagation();
      dispatch(nodesSelectPrevious(node, caretByPosition(event.caretRect)));
    } else if (
      isShortcutPressed(event, arrowDown) &&
      event.caretLine === event.lineCount - 1
    ) {
      event.preventDefault();
      event.stopPropagation();
      dispatch(nodesSelectNext(node, caretByPosition(event.caretRect)));
    } else {
      handleShortcut(event, nodesShortcutBindings, dispatch, node);
    }
  };

  useGlobalShortcuts(undoShortcutBindings);

  if (view.documentState !== DocumentState.READY) {
    return <LoadingScreen />;
  } else {
    return (
      <div className="App">
        <Canvas
          onClick={handleNodeClick}
          onChange={handleNodeChange}
          onKeyDown={handleNodeKeyDown}
          onFocusLost={handleNodeFocusLost}
          onToggleExpand={handleNodeToggleExpand}
          onToggleTodo={handleNodeToggleTodo}
          onPaste={handlePaste}
          onCopy={handleCopy}
          onCut={handleCut}
        />
      </div>
    );
  }
}

export default App;
