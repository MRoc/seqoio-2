import { getDefaultMiddleware } from "@reduxjs/toolkit";
import middlewareLog from "./middlewareLog.js";
import middlewareValidator from "./middlewareValidator.js";

export function middleware(otherMiddleware) {
  if (!Array.isArray(otherMiddleware)) {
    otherMiddleware = [otherMiddleware];
  }
  return [
    ...otherMiddleware,
    middlewareValidator,
    middlewareLog,
    ...getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
      thunk: true,
    }),
  ];
}
