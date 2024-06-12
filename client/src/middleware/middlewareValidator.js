import { isRoot, nodeSetToArray } from "../model/nodes.js";
import { selectDocument } from "../reducers/nodes.js";
import { createLogger } from "../library/logger.js";

let _logger;
function logger() {
  if (!_logger) {
    _logger = createLogger({ name: "Validator" });
  }
  return _logger;
}

export default function middlewareValidator(storeAPI) {
  return function wrapDispatch(next) {
    return function handleAction(action) {
      const result = next(action);

      const document = selectDocument(storeAPI.getState());

      const error = checkForErrors(document);
      if (error) {
        logger().error(error);
        return;
      }

      return result;
    };
  };
}

export function checkForErrors(document) {
  return (
    checkForNoNodes(document) ||
    checkForNodesNotBeingUndefined(document) ||
    checkForDistinctIds(document) ||
    checkForSingleRoot(document) ||
    checkForBrokenParentLink(document) ||
    checkForViewLayerProperties(document)
  );
}

function checkForNoNodes(document) {
  if (nodeSetToArray(document.nodes).length === 0) {
    return `Store contains no nodes!`;
  }
}

function checkForDistinctIds(document) {
  const ids = nodeSetToArray(document.nodes).map((n) => n.id);
  const distinctIds = ids.filter(onlyUnique);
  const duplicateIds = ids.length - distinctIds.length;
  if (duplicateIds > 0) {
    return `Store contains ${duplicateIds} duplicate of ${ids.length} ID(s)!`;
  }
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
}

function checkForNodesNotBeingUndefined(document) {
  const undefinedNodes = nodeSetToArray(document.nodes).filter((n) => !n);
  if (undefinedNodes.length !== 0) {
    return `Store contains ${undefinedNodes.length} undefined node(s)!`;
  }
}

function checkForSingleRoot(document) {
  // Check there is only a single root in the store
  const roots = nodeSetToArray(document.nodes).filter((n) => isRoot(n));
  if (roots.length !== 1) {
    return `Store contains ${roots.length} node(s) without parent but should only exactly one!`;
  }
}

function checkForBrokenParentLink(document) {
  // Check there are no orphaned nodes that have non existing parent in store
  const ids = nodeSetToArray(document.nodes).map((n) => n.id);
  const parentIds = nodeSetToArray(document.nodes)
    .map((n) => n.parentId)
    .filter((id) => id !== null);

  const orphanedSubtrees = parentIds.filter((id) => !ids.includes(id));
  if (orphanedSubtrees.length > 0) {
    return `Store contains ${orphanedSubtrees.length} orphaned subtree(s)!`;
  }
}

function checkForViewLayerProperties(document) {
  // Check there are no properties that only belong to the view layer
  const nodesWithViewPropertis = nodeSetToArray(document.nodes).filter(
    (n) => n.hasFocus || n.children || n.selectionRequest
  );
  if (nodesWithViewPropertis.length) {
    return `Store contains view properties!`;
  }
}
