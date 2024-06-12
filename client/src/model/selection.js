import { validate } from "../library/validate.js";
import { toTodoState, TodoState } from "./data.js";

export function withSelectionRequest(previousId, node, selectionRequest) {
  validate(node, "object");

  // HACK: When clicking on a node with CheckBox, the checkbox is inlined
  // into the text. To keep the cursor at the position the user clicked,
  // index selection is adjusted by '[ ] '.

  if (
    node &&
    previousId !== node.id &&
    toTodoState(node) !== TodoState.NONE &&
    selectionRequest &&
    selectionRequest.type === "index"
  ) {
    return {
      ...selectionRequest,
      start: selectionRequest.start + 4,
      end: selectionRequest.end + 4,
    };
  }

  return selectionRequest;
}
