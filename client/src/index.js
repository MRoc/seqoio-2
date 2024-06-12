import React from "react";
import ReactDOM from "react-dom";
import Cookies from "js-cookie";
import { Provider } from "react-redux";
import { createStore } from "./stores/store.js";
import { loadDocument } from "./api/sharedb.js";
import "./index.scss";
import App from "./components/App";

const userId = Cookies.get("user_id");
const connection = loadDocument(userId);
const store = createStore(connection);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
