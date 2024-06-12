import { configureStore } from "@reduxjs/toolkit";
import { reducer } from "../reducers/reducer.js";
import { middleware } from "../middleware/middleware.js";
import { createMiddlewareHistory } from "../middleware/middlewareHistory.js";
import { createMiddlewareSync } from "../middleware/middlewareSync.js";

export function createStore(connection) {
  let customMiddleware = [];
  if (connection) {
    customMiddleware = [
      createMiddlewareHistory(connection),
      createMiddlewareSync(connection),
    ];
  }
  return configureStore({
    reducer,
    middleware: middleware(customMiddleware),
  });
}
