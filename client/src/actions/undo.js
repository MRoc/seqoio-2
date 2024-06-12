import { undo, redo } from "./history.js";

export const shortcutBindings = [
  { key: "z", modifiers: ["Control"], action: undo },
  { key: "y", modifiers: ["Control"], action: redo },
];
