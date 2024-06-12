import React from "react";
import { DivContentEditable } from "@mroc/react-div-contenteditable";
import "@mroc/react-div-contenteditable/dist/index.css";
import PropTypes from "prop-types";
import "./Node.scss";
import Checkbox from "./Checkbox.js";
import NodeExpander from "./NodeExpander";
import HarveyBall from "./HarveyBall";
import {
  toText,
  toTodoState,
  toEditingText,
  TodoState,
} from "../model/data.js";
import { horizontalIndentation } from "./Layout";

export const expanderIndentation = 20;

function renderExpander(props) {
  return (
    <NodeExpander
      key={`${props.node.id}-expander`}
      node={props.node}
      onToggleExpand={props.onToggleExpand}
    />
  );
}

function renderCheckbox(props) {
  return (
    <Checkbox
      key={`${props.node.id}-checkbox`}
      checked={toTodoState(props.node) === TodoState.DONE}
      onChange={(e) => props.onToggleTodo(e, props.node)}
    />
  );
}

function renderHarveyBall(props) {
  const done = props.node.done;
  const totalTodos = calculateTotalTodos(props);
  const progress = done / totalTodos;
  return <HarveyBall progress={progress} />;
}

function renderDivContentEditable(props) {
  const text = props.node.hasFocus
    ? toEditingText(props.node, true)
    : toText(props.node);
  return (
    <DivContentEditable
      key={`${props.node.id}-div`}
      placeholder="Type here..."
      className=""
      onClick={(e) => props.onClick(e, props.node)}
      onFocusLost={(e) => props.onFocusLost(e, props.node)}
      onInput={(e) => props.onChange(e, props.node)}
      onKeyDown={(e) => props.onKeyDown(e, props.node)}
      onPaste={(e) => props.onPaste(e, props.node)}
      onCopy={(e) => props.onCopy(e, props.node)}
      onCut={(e) => props.onCut(e, props.node)}
      value={text}
      autoFocus={props.node.hasFocus}
      selection={props.node.selectionRequest}
    />
  );
}

function calculateTotalTodos(props) {
  return props.node.todo + props.node.done;
}

function tooltip(props) {
  const done = props.node.done;
  const totalTodos = calculateTotalTodos(props);
  return totalTodos > 0 ? `${done}/${totalTodos} done!` : "";
}

export default function Node(props) {
  const isHarveyBallVisible =
    props.node.children.length > 0 && calculateTotalTodos(props) > 0;
  const isExpanderVisible =
    props.node.children.length > 0 || !props.node.parentId;
  const isCheckboxVisible =
    toTodoState(props.node) !== TodoState.NONE &&
    !props.node.hasFocus &&
    props.node.children.length === 0;

  const style = {
    marginLeft: props.node.x + (isExpanderVisible ? 0 : horizontalIndentation),
  };

  return (
    <div
      key={`${props.node.id}-container`}
      className="Node"
      id={props.node.id}
      style={style}
      title={tooltip(props)}
    >
      {isExpanderVisible && renderExpander(props)}
      {isCheckboxVisible && renderCheckbox(props)}
      {isHarveyBallVisible && renderHarveyBall(props)}
      {renderDivContentEditable(props)}
    </div>
  );
}

Node.propTypes = {
  node: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onFocusLost: PropTypes.func.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onToggleTodo: PropTypes.func.isRequired,
  onPaste: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onCut: PropTypes.func.isRequired,
};
