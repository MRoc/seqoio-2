import * as R from "ramda";
import { createLogger } from "../library/logger.js";
import { nodeSetToArray } from "../model/nodes.js";

const logger = createLogger({ name: "Layout" });

export const horizontalIndentation = 16;
export const lineHeight = 24;

const calculateLayout = (node, x, y) => {
  node.x = x;

  x += horizontalIndentation;

  let result = [node];
  if (node.isExpanded) {
    for (const child of node.children) {
      const newNodes = calculateLayout(child, x, y);
      result = result.concat(newNodes);
    }
  }
  return result;
};

const calculateLayouts = (nodes) => {
  return nodeSetToArray(nodes)
    .filter((n) => n.parentId === null)
    .flatMap((r) => calculateLayout(r, 0, 0));
};

const calculateLines = (nodes) => {
  const lines = [];

  const parents = nodes.filter(
    (n) => n.children && n.children.length > 0 && n.isExpanded
  );

  for (const parent of parents) {
    const child = R.last(parent.children);
    lines.push({
      id0: parent.id,
      id1: child.id,
      type: "vertical",
    });
  }

  for (const parent of parents) {
    for (const child of parent.children) {
      lines.push({
        id0: parent.id,
        id1: child.id,
        type: "horizontal",
      });
    }
  }

  return lines;
};

export const layoutNodes = (augumentedNodes) => {
  logger.trace(`Layout ${augumentedNodes.length} nodes`);
  const layoutedNodes = calculateLayouts(augumentedNodes);
  const lines = calculateLines(layoutedNodes);
  return {
    nodes: layoutedNodes,
    lines: lines,
  };
};
