import { withSelectionRequest } from "./selection.js";
import { createNode } from "./nodes.js";
import { createData, TodoState } from "./data.js";

describe("withSelectionRequest", () => {
  test("When having new selection and type index, ajust index for TodoState", () => {
    const node = createNode(0, null, 0, true, createData("", TodoState.TODO));
    const sr0 = { type: "index", start: 1, end: 3 };
    const sr1 = withSelectionRequest(undefined, node, sr0);
    expect(sr1.start).toBe(5);
  });
  test("When node does not change, do nothing", () => {
    const node = createNode(0, null, 0, true, createData("", TodoState.TODO));
    const sr0 = { type: "index", start: 1, end: 3 };
    const sr1 = withSelectionRequest(0, node, sr0);
    expect(sr1).toBe(sr0);
  });
  test("When selection type is position, do nothing", () => {
    const node = createNode(0, null, 0, true, createData("", TodoState.TODO));
    const sr0 = { type: "position" };
    const sr1 = withSelectionRequest(undefined, node, sr0);
    expect(sr1).toBe(sr1);
  });
});
