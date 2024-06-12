// 1. Actions: History actions undo/redo which check availability and then dispatch an action to execute.
// 2. Reducer: History reducer which manages just the state of history including undo stack, redo stack, last time.
// 3. Middleware Which handles undo/redo, triggers sharedb changes and updates state.
//   - beforeOp: Must add own ops and inverse ops to history state.
//   - opOp: Must transform the history state for foreign ops.
//   - undo/redo: Must handle the execution of undo redo by executing ops and suppressing adding again to store. Will also trigger an update of the state.
// 4. API: Business logic on top of the state. All mutating operations must return a new state. Will be used by reducer and to check availablilty.
//
// Undo:
// 1. Action uses API and checks in state
// 2. Action dispatches UNDO
// 3. Middleware intercepts UNDO
// 4. Middleware executes UNDO and dispatches state change

import { history } from "../model/history.js";
import { type } from "../model/optype.js";
import { selectHistory } from "../reducers/history.js";
import { createLogger } from "../library/logger.js";
import * as ActionTypes from "../actions/historyTypes.js";

const logger = createLogger({ name: "History" });

export function createMiddlewareHistory({ doc }) {
  return function middlewareHistory(storeAPI) {
    logger.debug(`Creating history middleware`);

    if (!type.invertWithDoc) {
      throw new Error(`Type is required to support 'invertWithDoc'!`);
    }
    if (!type.transform) {
      throw new Error(`Type is required to support 'transform'!`);
    }
    if (!storeAPI) {
      throw new Error(`StoreAPI is required'!`);
    }

    const api = {
      _isUndoSuppressed: false,
      getState: function () {
        return selectHistory(storeAPI.getState());
      },
      setState: function (state) {
        storeAPI.dispatch({ type: ActionTypes.HISTORY, payload: { state } });
      },
      hasUndo: function () {
        return history(type, this.getState()).hasUndo();
      },
      undo: function (onError) {
        if (!this.hasUndo()) {
          throw new Error(`Can't undo!`);
        }
        const { state, op } = history(type, this.getState()).undo(doc.data);
        this.setState(state);
        this._suppressUndo(() => doc.submitOp(op, null, onError));
      },
      hasRedo: function () {
        return history(type, this.getState()).hasRedo();
      },
      redo: function (onError) {
        if (!this.hasRedo()) {
          throw new Error(`Can't redo!`);
        }
        const { state, op } = history(type, this.getState()).redo(doc.data);
        this.setState(state);
        this._suppressUndo(() => doc.submitOp(op, null, onError));
      },
      forceNewTransaction() {
        this.setState(history(type, this.getState()).forceNewTransaction());
      },
      _onBeforeOp(op, isOwnOp) {
        if (isOwnOp && !this._isUndoSuppressed) {
          this.setState(history(type, this.getState()).addOp(op, doc.data));
        }
      },
      _onOp(op, isOwnOp) {
        if (!isOwnOp) {
          this.setState(history(type, this.getState()).transform(op));
        }
      },
      _suppressUndo(func) {
        try {
          this._isUndoSuppressed = true;
          func();
        } finally {
          this._isUndoSuppressed = false;
        }
      },
    };

    doc.on("before op", (op, isOwnOp) => {
      api._onBeforeOp(op, isOwnOp);
    });

    doc.on("op", (op, isOwnOp) => {
      api._onOp(op, isOwnOp);
    });

    return function wrapDispatch(next) {
      return async function handleAction(action) {
        if (action.type === ActionTypes.UNDO) {
          api.undo();
        } else if (action.type === ActionTypes.REDO) {
          api.redo();
        } else {
          return next(action);
        }
      };
    };
  };
}
