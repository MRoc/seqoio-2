import { Connection, types } from "sharedb/lib/client";
import { type } from "ot-json1";
import { createLogger } from "../library/logger.js";
import { arrayToNodeSet, createNode, emptySelection } from "../model/nodes.js";

const logger = createLogger({ name: "ShareDB" });

types.register(type);

function wsUri() {
  const uri = new URL(window.location.href);
  const host = uri.host;
  const protocol = uri.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}`;
}

export function loadDocument(id) {
  logger.debug(`Creating webSocket`);
  const socket = new WebSocket(wsUri());

  logger.debug(`Creating ShareDB`);
  const connection = new Connection(socket);
  connection.debug = process.env.REACT_APP_SHAREDB_DEBUG === "true";

  const collection = "documents";
  logger.info(`Loading document ${collection}/${id}`);
  const doc = connection.get(collection, id);

  const promise = new Promise((resolve, reject) => {
    doc.subscribe((error) => {
      if (error) {
        logger.error("Unable to subscribe document!");
        return reject(error);
      }

      if (!doc.type) {
        logger.debug(`Creating document ${collection}/${id}...`);
        doc.create(createDefaultDocument(), type.name, (err) => {
          if (err) {
            logger.error("Unable to create document!");
            reject(err);
          } else {
            logger.debug("Document created!");
            resolve(doc);
          }
        });
      } else {
        resolve(doc);
      }
    });
  });

  return {
    promise,
    connection,
    socket,
    doc,
  };
}

function createDefaultDocument() {
  return {
    nodes: arrayToNodeSet([createNode()]),
    selection: emptySelection(),
  };
}
