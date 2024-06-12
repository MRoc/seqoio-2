import React from "react";
import PropTypes from "prop-types";
import { horizontalIndentation, lineHeight } from "./Layout";
import "./NodeExpander.scss";

export const arrowWidth = 12;
export const arrowHeight = 12;

export default function NodeExpander(props) {
  const deg = props.node.isExpanded ? "0" : "-90";
  const marginH = horizontalIndentation - arrowWidth;
  const marginV = (lineHeight - arrowHeight) * 0.5;
  const style = {
    width: arrowWidth,
    height: arrowHeight,
    minWidth: arrowWidth,
    minHeight: arrowHeight,
    marginLeft: 0,
    marginRight: marginH,
    marginTop: marginV,
    marginBottom: marginV,
  };

  return (
    <svg
      className="NodeExpander"
      style={style}
      onClick={(e) => props.onToggleExpand(e, props.node)}
    >
      <path
        transform={`rotate(${deg}, 6, 6)`}
        d="M 0 3 L 6 9 L 12 3"
        fill="transparent"
        className="NodeExpanderPath"
      />
    </svg>
  );
}

NodeExpander.propTypes = {
  node: PropTypes.object.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
};
