import { createNode } from "./nodes.js";

import {
  createData,
  fromEditingText,
  TodoState,
  toEditingText,
} from "./data.js";

describe("toEditingText", () => {
  test("With todo state NONE returns text", () => {
    const node = createNode(
      0,
      null,
      0,
      true,
      createData("Text", TodoState.NONE)
    );
    const output = toEditingText(node);
    expect(output).toBe("Text");
  });
  test("With todo state TODO and non-breaking space prepends '[ ] '", () => {
    const node = createNode(
      0,
      null,
      0,
      true,
      createData("Text", TodoState.TODO)
    );
    const output = toEditingText(node, true);
    expect(output).toBe("[\xA0]\xA0Text");
  });
  test("With todo state DONE and non-breaking space prepends '[X] '", () => {
    const node = createNode(
      0,
      null,
      0,
      true,
      createData("Text", TodoState.DONE)
    );
    const output = toEditingText(node, true);
    expect(output).toBe("[X]\xA0Text");
  });
  test("With todo state TODO and normal space prepends '[ ] '", () => {
    const node = createNode(
      0,
      null,
      0,
      true,
      createData("Text", TodoState.TODO)
    );
    const output = toEditingText(node, false);
    expect(output).toBe("[ ] Text");
  });
  test("With todo state DONE and normal space prepends '[X] '", () => {
    const node = createNode(
      0,
      null,
      0,
      true,
      createData("Text", TodoState.DONE)
    );
    const output = toEditingText(node, false);
    expect(output).toBe("[X] Text");
  });
});

describe("fromEditingText", () => {
  test("Todo", () => {
    const output = fromEditingText(
      createNode(null, "", null, true, TodoState.NONE),
      "[ ] Text"
    );
    expect(output.text).toBe("Text");
    expect(output.todoState).toBe(TodoState.TODO);
  });
  test("Todo with non-breaking space", () => {
    const output = fromEditingText(
      createNode(null, "", null, true, TodoState.NONE),
      "[\xA0] Text"
    );
    expect(output.text).toBe("Text");
    expect(output.todoState).toBe(TodoState.TODO);
  });
  test("Done", () => {
    const output = fromEditingText(
      createNode(null, "", null, true, TodoState.NONE),
      "[X] Text"
    );
    expect(output.text).toBe("Text");
    expect(output.todoState).toBe(TodoState.DONE);
  });
  test("None", () => {
    const output = fromEditingText(
      createNode(null, "", null, true, TodoState.TODO),
      "Text"
    );
    expect(output.text).toBe("Text");
    expect(output.todoState).toBe(TodoState.NONE);
  });
});
