import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { layoutNodes } from "./Layout";
import { selectAugumentedNodes } from "../reducers/nodes.js";
import Node from "./Node";
import CanvasTreeDecorator from "./CanvasTreeDecorator.js";
import "./Canvas.scss";

function CanvasFunc(props) {
  return (
    <div className="Canvas">
      <CanvasTreeDecorator lines={props.lines} />
      {props.nodes.map((n) => (
        <Node
          key={n.id}
          node={n}
          onClick={props.onClick}
          onChange={props.onChange}
          onKeyDown={props.onKeyDown}
          onFocusLost={props.onFocusLost}
          onToggleExpand={props.onToggleExpand}
          onToggleTodo={props.onToggleTodo}
          onPaste={props.onPaste}
          onCopy={props.onCopy}
          onCut={props.onCut}
        />
      ))}
    </div>
  );
}

CanvasFunc.propTypes = {
  nodes: PropTypes.array.isRequired,
  lines: PropTypes.array.isRequired,
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

const mapStateToProps = (state) => {
  return layoutNodes(selectAugumentedNodes(state));
};

const Canvas = connect(mapStateToProps)(CanvasFunc);

export default Canvas;
