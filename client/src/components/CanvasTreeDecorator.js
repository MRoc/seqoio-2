import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useWindowSize } from "@react-hook/window-size";
import "./CanvasTreeDecorator.scss";

import { createLogger } from "../library/logger.js";

const logger = createLogger({ name: "CanvasTreeDecorator" });

function createLayoutLines(lines) {
  const layoutedLines = [];
  for (const line of lines) {
    const node0 = document.getElementById(line.id0);
    const node1 = document.getElementById(line.id1);
    if (line.type === "vertical") {
      layoutedLines.push({
        id: `${line.id0}-${line.id1}-v`,
        x0: node0.offsetLeft + 6,
        y0: node0.offsetTop + 20,
        x1: node0.offsetLeft + 6,
        y1: node1.offsetTop + 12,
      });
    } else {
      layoutedLines.push({
        id: `${line.id0}-${line.id1}-h`,
        x0: node0.offsetLeft + 6,
        y0: node1.offsetTop + 12,
        x1: node0.offsetLeft + 14,
        y1: node1.offsetTop + 12,
      });
    }
  }
  logger.trace(`Layout ${layoutedLines.length} lines`);
  return layoutedLines;
}

function CanvasTreeDecorator(props) {
  const canvasSvg = useRef(null);
  const [width, height] = useWindowSize();
  const [lines, setLines] = useState([]);

  useEffect(() => {
    setLines(createLayoutLines(props.lines));
  }, [width, height, canvasSvg, props.lines]);

  return (
    <svg className="CanvasSvg" ref={canvasSvg}>
      {lines.map((l) => (
        <line
          key={l.id}
          className="CanvasSvgLine"
          x1={l.x0}
          y1={l.y0}
          x2={l.x1}
          y2={l.y1}
        />
      ))}
    </svg>
  );
}

CanvasTreeDecorator.propTypes = {
  lines: PropTypes.array.isRequired,
};

export default CanvasTreeDecorator;
