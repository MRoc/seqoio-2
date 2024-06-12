import { createNode } from "./nodes.js";
import { createData, TodoState } from "./data.js";
import { parseNodes } from "./import.js";

let mockGuidCounter = 0;
jest.mock("uuid", () => ({ v4: () => (mockGuidCounter++).toString() }));

describe("parseNodes", () => {
  test("With single line", () => {
    mockGuidCounter = 0;
    const text = "Text";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData(text, TodoState.NONE)),
    ]);
  });
  test("With unchecked todo", () => {
    mockGuidCounter = 0;
    const text = "[ ] Text";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text", TodoState.TODO)),
    ]);
  });
  test("With checked todo", () => {
    mockGuidCounter = 0;
    const text = "[X] Text";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text", TodoState.DONE)),
    ]);
  });
  test("With three lines", () => {
    mockGuidCounter = 0;
    const text = "- Text1\n* Text2\n+ Text3";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text1", TodoState.NONE)),
      createNode("1", null, 1, true, createData("Text2", TodoState.NONE)),
      createNode("2", null, 2, false, createData("Text3", TodoState.NONE)),
    ]);
    expect(nodes.reduce((a, n) => a, false)).toBeFalsy();
  });
  test("With three lines with indent", () => {
    mockGuidCounter = 0;
    const text = "Text1\n  Text2\n    Text3";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text1", TodoState.NONE)),
      createNode("1", "0", 1, true, createData("Text2", TodoState.NONE)),
      createNode("2", "1", 2, true, createData("Text3", TodoState.NONE)),
    ]);
  });
  test("With three lines with indent inverse", () => {
    mockGuidCounter = 0;
    const text = "    Text1\n  Text2\nText3";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text1", TodoState.NONE)),
      createNode("1", null, 1, true, createData("Text2", TodoState.NONE)),
      createNode("2", null, 2, true, createData("Text3", TodoState.NONE)),
    ]);
  });
  test("With indenation going back more then one", () => {
    mockGuidCounter = 0;
    const text = "Text0\n  Text1\n    Text2\n      Text3\n  Text4";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text0", TodoState.NONE)),
      createNode("1", "0", 1, true, createData("Text1", TodoState.NONE)),
      createNode("2", "1", 2, true, createData("Text2", TodoState.NONE)),
      createNode("3", "2", 3, true, createData("Text3", TodoState.NONE)),
      createNode("4", "0", 4, true, createData("Text4", TodoState.NONE)),
    ]);
  });
  test("With broken indentation", () => {
    mockGuidCounter = 0;
    const text =
      "  Text0\nText1\n    Text2\n      Text3\n    Text4\n  Text5\nText6";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("Text0", TodoState.NONE)),
      createNode("1", null, 1, true, createData("Text1", TodoState.NONE)),
      createNode("2", "1", 2, true, createData("Text2", TodoState.NONE)),
      createNode("3", "2", 3, true, createData("Text3", TodoState.NONE)),
      createNode("4", "1", 4, true, createData("Text4", TodoState.NONE)),
      createNode("5", null, 5, true, createData("Text5", TodoState.NONE)),
      createNode("6", null, 6, true, createData("Text6", TodoState.NONE)),
    ]);
  });
  test("With empty text", () => {
    mockGuidCounter = 0;
    const text = "- \n  - ";
    const nodes = parseNodes(text);
    expect(nodes).toStrictEqual([
      createNode("0", null, 0, true, createData("", TodoState.NONE)),
      createNode("1", "0", 1, true, createData("", TodoState.NONE)),
    ]);
  });
});
