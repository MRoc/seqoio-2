import { createNode } from "./nodes.js";
import { TodoState, createData } from "./data.js";

const countIndent = (text) => {
  return text.search(/\S/) / 2;
};

const splitLines = (text) => {
  return text.match(/[^\r\n]+/g).map((l) => {
    return { indent: countIndent(l), text: l.trimStart() };
  });
};

const stripOffExpander = (text) => {
  return [!text.startsWith("+ "), text.replace(/^([-\s]|[*\s]|[+\s])./, "")];
};

const stripOffTodoState = (text) => {
  return [
    text.startsWith("[ ]")
      ? TodoState.TODO
      : text.startsWith("[X]")
      ? TodoState.DONE
      : TodoState.NONE,
    text.replace(/^(\[\s\]|\[X])\s/, ""),
  ];
};

const parseNode = (parentId, text0, order = 0) => {
  const [isExpanded, text1] = stripOffExpander(text0);
  const [todoState, text2] = stripOffTodoState(text1);
  return createNode(
    undefined,
    parentId,
    order,
    isExpanded,
    createData(text2, todoState)
  );
};

export const parseNodes = (text) => {
  const lines = splitLines(text);

  const stack = [];
  let parentId = null;
  let indent = 0;
  let previousId = null;
  let order = 0;

  const newNodes = [];
  for (const line of lines) {
    if (line.indent > indent) {
      stack.push(parentId);
      parentId = previousId;
      indent = line.indent;
    }
    while (line.indent < indent && stack.length > 1) {
      parentId = stack.pop();
      indent--;
    }

    const newNode = parseNode(parentId, line.text, order++);
    newNodes.push(newNode);
    previousId = newNode.id;
  }

  return newNodes;
};
