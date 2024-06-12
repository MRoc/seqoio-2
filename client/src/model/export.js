import { toEditingText } from "./data.js";
import { nodesApi } from "./nodes.js";

const createIndentation = (indentLevel, separator = "  ") => {
  let result = "";
  for (let i = 0; i < indentLevel; ++i) {
    result += separator;
  }
  return result;
};

const nodeToText = (
  singleLine,
  indentLevel,
  hasChildren,
  node,
  separator = "  "
) => {
  const indent = createIndentation(indentLevel, separator);
  const mark = singleLine ? "" : node.isExpanded || !hasChildren ? "- " : "+ ";
  return `${indent}${mark}${toEditingText(node, false)}`;
};

export const toFormattedText = (nodes, node, separator = "  ") => {
  const api = nodesApi({ nodes });
  const indent = api.getIndentation(node);
  const nodesToExport = api.getNodeAndDescendants(node);
  const singleLine = nodesToExport.length === 1;
  return nodesToExport
    .map((n) => {
      const i = api.getIndentation(n);
      const hasChildren =
        nodesApi({ nodes: nodesToExport }).getChildren(n).length > 0;
      return nodeToText(singleLine, i - indent, hasChildren, n, separator);
    })
    .join("\n");
};
