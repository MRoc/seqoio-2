const cookieParser = require("cookie-parser")();
const jwt = require("jsonwebtoken");
const config = require("../../config/config");

const log = require("../../services/logging").getLogger("ShareDBAuth");

// Access control must be done here.
// https://github.com/share/sharedb/issues/169
// https://github.com/dmapper/sharedb-access
//
function handleUpgrade(server, wss) {
  server.on("upgrade", function (request, socket, head) {
    log.debug(`Upgrading WebSocket`);

    log.trace(`Parsing cookies`);
    cookieParser(request, request, () => {});

    const token = request.cookies.token;

    log.trace(`Verify JWT`);
    if (verifyJwt(token)) {
      log.trace(`Valid JWT, upgrading now...`);
      wss.handleUpgrade(request, socket, head, function (ws) {
        request.token = jwt.decode(token);
        wss.emit("connection", ws, request);
      });
    } else {
      log.error(`Invalid JWT, closing connection!`);
      socket.write(`HTTP/1.1 401 Unauthorized\r\n\r\n`);
      socket.destroy();
    }
  });
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    log.error(err);
    return false;
  }
}

module.exports = { handleUpgrade };
