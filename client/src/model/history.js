import { validate } from "../library/validate";
import { createLogger } from "../library/logger.js";

const logger = createLogger({ name: "History" });

export function defaultHistory() {
  return { undoStack: [], redoStack: [], undoStackPushTime: -Infinity };
}

export function history(
  ottype,
  state = defaultHistory(),
  options = { composeInterval: 1000 }
) {
  validate(ottype.invertWithDoc, "function");
  validate(ottype.transform, "function");
  validate(state, "object");
  const api = {
    hasUndo: function () {
      return state.undoStack.length > 0;
    },
    undo: function (doc) {
      if (!this.hasUndo()) {
        throw new Error(`Can't undo!`);
      }

      const op = arrLast(state.undoStack);
      const opInvert = ottype.invertWithDoc(op, doc);

      const newState = {
        ...state,
        undoStack: arrSkipLast(state.undoStack),
        redoStack: arrAdd(state.redoStack, opInvert),
      };

      return { state: newState, op };
    },
    hasRedo: function () {
      return state.redoStack.length > 0;
    },
    redo: function (doc) {
      if (!this.hasRedo()) {
        throw new Error(`Can't redo!`);
      }
      const op = arrLast(state.redoStack);
      const opInvert = ottype.invertWithDoc(op, doc);

      const newState = {
        ...state,
        undoStack: arrAdd(state.undoStack, opInvert),
        redoStack: arrSkipLast(state.redoStack),
      };

      return { state: newState, op };
    },
    forceNewTransaction() {
      return {
        ...state,
        undoStackPushTime: -Infinity,
      };
    },
    transform(op) {
      return {
        ...state,
        undoStack: this._transform(state.undoStack, op),
        redoStack: this._transform(state.redoStack, op),
      };
    },
    addOp: function (op, doc) {
      if (!ottype.invertWithDoc) {
        throw new Error(`Type does not support invertWithDoc!`);
      }

      logger.trace(`Add op: ${JSON.stringify(op)}`);

      const opInvert = ottype.invertWithDoc(op, doc);
      const opComposed = this._tryComposeOp(opInvert);
      const undoStackPushTime = Date.now();
      const undoStack = opComposed
        ? arrReplaceLast(state.undoStack, opComposed)
        : arrAdd(state.undoStack, opInvert);
      const redoStack = [];

      return { ...state, undoStack, redoStack, undoStackPushTime };
    },
    _transform(stack, op) {
      try {
        return stack.map((o) => ottype.transform(o, op, "left"));
      } catch (err) {
        logger.error(err);
        logger.error(JSON.stringify(stack));
        logger.error(JSON.stringify(op));
        return stack;
      }
    },
    _tryComposeOp(op) {
      if (
        ottype.compose &&
        state.undoStack.length > 0 &&
        Date.now() - state.undoStackPushTime < options.composeInterval
      ) {
        return ottype.compose(op, arrLast(state.undoStack));
      }
    },
  };

  return api;
}

function arrLast(arr) {
  validate(arr, "array");
  return arr[arr.length - 1];
}

function arrReplaceLast(arr, obj) {
  validate(arr, "array");
  validate(obj, "array");
  return [...arrSkipLast(arr), obj];
}

function arrSkipLast(arr) {
  validate(arr, "array");
  return arr.slice(0, arr.length - 1);
}

function arrAdd(arr, obj) {
  validate(arr, "array");
  validate(obj, "array");
  return [...arr, obj];
}
