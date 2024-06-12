import React from "react";
import { render, screen } from "@testing-library/react";
import { createStore } from "../stores/store.js";
import { Provider } from "react-redux";
import App from "./App";
import { type } from "../model/optype.js";
import { TestDocument } from "../tests/testDocument.js";
import { arrayToNodeSet } from "../model/nodes.js";
import { parseNodes } from "../model/import.js";

describe("App", () => {
  test("Renders loading screen", () => {
    const loadResult = createLoadDocumentResult();
    render(
      <Provider store={createStore(loadResult)}>
        <App />
      </Provider>
    );
    expect(screen.getByAltText(/Seqoio logo/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Loading animation/i)).toBeInTheDocument();
  });
  test("Load initial document from server", async () => {
    const loadResult = createLoadDocumentResult({
      nodes: arrayToNodeSet(parseNodes("- MyText")),
    });
    render(
      <Provider store={createStore(loadResult)}>
        <App />
      </Provider>
    );

    loadResult.doc.emit("load");

    const element = await screen.findByText(/MyText/i);
    expect(element).toBeInTheDocument();
  });
  function createLoadDocumentResult(data = {}) {
    return {
      doc: new TestDocument(type, data),
      promise: Promise.resolve({}),
      connection: {
        on: function () {},
      },
    };
  }
});
