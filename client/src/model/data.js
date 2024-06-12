import { withNodeData } from "./nodes.js";

export const TodoState = {
  NONE: 0,
  TODO: 1,
  DONE: 2,
};

export function createData(text, todoState = TodoState.NONE) {
  return { text, todoState };
}

export function toEditingText(node, useNonBreakingSpace) {
  const space = useNonBreakingSpace ? "\xA0" : " ";
  const mark =
    toTodoState(node) === TodoState.TODO
      ? `[${space}]${space}`
      : toTodoState(node) === TodoState.DONE
      ? `[X]${space}`
      : "";
  return mark + toText(node);
}

export function fromEditingText(node, text) {
  const stripOffTodoState = (text) => {
    return [
      text.match(/^\[\s\]\s/)
        ? TodoState.TODO
        : text.match(/^\[X\]\s/)
        ? TodoState.DONE
        : TodoState.NONE,
      text.replace(/^(\[\s\]|\[X])\s/, ""),
    ];
  };

  const [todoState, text2] = stripOffTodoState(text);
  return withNodeData(createData(text2, todoState));
}

export function fromEditingTextToData(node, text) {
  const stripOffTodoState = (text) => {
    return [
      text.match(/^\[\s\]\s/)
        ? TodoState.TODO
        : text.match(/^\[X\]\s/)
        ? TodoState.DONE
        : TodoState.NONE,
      text.replace(/^(\[\s\]|\[X])\s/, ""),
    ];
  };

  const [todoState, text2] = stripOffTodoState(text);

  if (toText(node) === text2 && toTodoState(node) === todoState) {
    return node.data;
  } else if (todoState === TodoState.NONE && text2 === "") {
    return null;
  } else {
    return { text: text2, todoState };
  }
}

export function toTodoState(node) {
  return node.data ? node.data.todoState : TodoState.NONE;
}

export function toText(node) {
  return node.data ? node.data.text : "";
}

export function todoStateAugumenter(augumentedNodes) {
  for (const augumentedNode of augumentedNodes) {
    const [todo, done] = countTodoState(augumentedNode);
    augumentedNode.todo = todo;
    augumentedNode.done = done;
  }
  return augumentedNodes;
}

function countTodoState(augumentedNode) {
  let todo = 0;
  let done = 0;

  if (augumentedNode.children.length === 0) {
    switch (toTodoState(augumentedNode)) {
      case TodoState.TODO:
        todo++;
        break;
      case TodoState.DONE:
        done++;
        break;
    }
  }

  for (const child of augumentedNode.children) {
    const [childTodo, childDone] = countTodoState(child);
    todo += childTodo;
    done += childDone;
  }

  return [todo, done];
}
