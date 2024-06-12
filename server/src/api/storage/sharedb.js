const WebSocket = require("ws");
const WebSocketJSONStream = require("@teamwork/websocket-json-stream");
const ShareDbMongoDbAdapter = require("sharedb-mongo");
const ShareDB = require("sharedb");
const { type } = require("ot-json1");
const { handleUpgrade } = require("./sharedbauth.js");
const config = require("../../config/config");
const log = require("../../services/logging").getLogger("ShareDB");

log.info(`MongoDB adapter connecting to ${config.database}`);
const db = new ShareDbMongoDbAdapter(config.database);

function startShareDb(server) {
  ShareDB.types.register(type);

  log.info(`ShareDB...`);
  const shareDBServer = new ShareDB({ db });

  log.info(`WebSocket server...`);
  const wss = new WebSocket.Server({ noServer: true });

  // 1. Ensures connections have a valid JWT
  handleUpgrade(server, wss);

  wss.on("connection", function connection(socket, request) {
    log.debug(`WebSocket connection...`);
    const jsonStream = new WebSocketJSONStream(socket);
    shareDBServer.listen(jsonStream, request);
  });

  // TODO Connection loss is not handled. Needs to be taken care of.
  // https://github.com/websockets/ws > https://github.com/websockets/ws
  wss.on("close", function close() {
    log.debug(`WebSocket close...`);
  });

  shareDBServer.use("connect", function (context, next) {
    log.debug(`ShareDB connect (${context.agent.clientId})...`);
    if (!context.req || !context.req.token) {
      next("No token provided!");
    } else {
      context.agent.token = context.req.token;
      next();
    }
  });

  shareDBServer.use("receive", function (context, next) {
    log.debug(`ShareDB receive (${context.agent.clientId})`);
    log.debug(`+--- ${JSON.stringify(context.data)}`);

    // 2. Ensures user is allowed to access document!
    if (
      context.data &&
      context.data.d &&
      context.data.d !== context.agent.token.id
    ) {
      next(
        `User ${context.agent.token.id} not authorized to access document ${context.data.d}!`
      );
    }

    next();
  });

  shareDBServer.use("reply", function (context, next) {
    log.debug(`ShareDB reply (${context.agent.clientId})...`);
    log.debug(`+--- ${JSON.stringify(context.reply)}`);
    next();
  });

  shareDBServer.use("readSnapshots", function (context, next) {
    log.debug(`ShareDB readSnapshots (${context.agent.clientId})...`);
    next();
  });

  shareDBServer.use("sendPresence", function (context, next) {
    log.debug(`ShareDB sendPresence (${context.agent.clientId})...`);
    next();
  });

  shareDBServer.use("query", function (context, next) {
    log.debug(`ShareDB query (${context.agent.clientId})...`);
    next("Query not supported!");
  });
}

module.exports = {
  startShareDb,
};
