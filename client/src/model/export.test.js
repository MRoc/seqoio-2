import { toFormattedText } from "./export.js";
import { parseNodes } from "./import.js";

describe("toFormattedText", () => {
  test("With single node", () => {
    const nodes = parseNodes("Text");
    const output = toFormattedText(nodes, nodes[0]);
    expect(output).toBe("Text");
  });
  test("With todo state being TODO", () => {
    const nodes = parseNodes("[ ] Text");
    const output = toFormattedText(nodes, nodes[0]);
    expect(output).toBe("[ ] Text");
  });
  test("With multiple nodes", () => {
    const nodes = parseNodes("- Text 0\n  - Text 1\n  - Text 2");
    const output = toFormattedText(nodes, nodes[0]);
    expect(output).toBe("- Text 0\n  - Text 1\n  - Text 2");
  });
  test("With collapsed node", () => {
    const nodes = parseNodes("+ Text 0\n  - Text 1");
    const output = toFormattedText(nodes, nodes[0]);
    expect(output).toBe("+ Text 0\n  - Text 1");
  });
});
