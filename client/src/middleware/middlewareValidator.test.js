import { createNode } from "../model/nodes.js";
import { createData } from "../model/data.js";
import { testStore } from "../tests/testStore.js";
import { checkForErrors } from "./middlewareValidator.js";
import { selectDocument } from "../reducers/nodes.js";

jest.mock("../library/logger.js", () => ({
  createLogger: function (name) {
    return {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  },
}));

describe("checkForErrors", () => {
  test("With default store", () => {
    const document = selectDocument(testStore([]).getState());
    const error = checkForErrors(document);
    expect(error).toBe("Store contains no nodes!");
  });
  test("With orphaned parent", () => {
    const document = selectDocument(
      testStore([
        createNode("a", null, 0, true, createData("Root")),
        createNode("b", "c", 0, true, createData("A")),
      ]).getState()
    );
    const error = checkForErrors(document);
    expect(error).toBe("Store contains 1 orphaned subtree(s)!");
  });
});
