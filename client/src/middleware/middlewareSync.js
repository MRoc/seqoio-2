import { executeOp, loadInitialDocument } from "../actions/nodes.js";
import { createLogger } from "../library/logger.js";
import { setFatalError } from "../actions/view.js";

const logger = createLogger({ name: "Sync" });

export function createMiddlewareSync({ promise, doc, connection }) {
  return function middlewareSync(storeAPI) {
    logger.debug(`Creating sync middleware`);

    doc.on("create", () => {
      if (doc.data) {
        logger.debug("Document created");
        storeAPI.dispatch(loadInitialDocument(doc.data));
      }
    });
    doc.on("load", () => {
      if (doc.data) {
        logger.debug("Document loaded");
        storeAPI.dispatch(loadInitialDocument(doc.data));
      }
    });
    doc.on("op", (op, isOwnOp) => {
      logger.debug(`Document received operation isOwnOp=${isOwnOp}`);
      storeAPI.dispatch(executeOp(op));
    });

    connection.on("connection error", (err) => {
      storeAPI.dispatch(setFatalError(`A connection error occured! ${err}`));
    });
    promise.catch((err) => {
      storeAPI.dispatch(setFatalError(err.toString()));
    });

    return function wrapDispatch(next) {
      return async function handleAction(action) {
        if (action.meta && action.meta.sync && action.payload.op) {
          doc.submitOp(action.payload.op);
        } else {
          return next(action);
        }
      };
    };
  };
}
