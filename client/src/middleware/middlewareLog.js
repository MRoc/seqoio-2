import { createLogger } from "../library/logger.js";

const logger = createLogger({ name: "Reducer" });

export default function middlewareLog(storeAPI) {
  return function wrapDispatch(next) {
    return function handleAction(action) {
      if (action.payload && action.payload.node) {
        logger.info(`Reducer ${action.type} ${action.payload.node.id}`);
      } else if (action.type) {
        logger.info(`Reducer ${action.type}`);
      } else if (typeof action === "function") {
        // Ignore
      } else {
        logger.warning(`Reducer Unknown!`);
      }
      return next(action);
    };
  };
}
