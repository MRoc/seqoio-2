require("dotenv").config();
const http = require("http");
const express = require("express");
const path = require("path");
const cors = require("cors");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const mongoose = require("mongoose");
const auth = require("./authentication/middleware/authentication");
const passport = auth(require("passport"));
const config = require("./config/config");
const log = require("./services/logging").getLogger("Server");

const routeAuthentication = require("./authentication/routes/authentication");
const routeSpa = express.static(path.join(__dirname, "../../client/build"));

const sharedb = require("./api/storage/sharedb");

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(config.database, {
  autoIndex: true,
  autoCreate: true,
});

mongoose.connection.on("error", (error) => log.error(error));
mongoose.Promise = global.Promise;

app.set("view engine", "pug");
app.set("views", "./authentication/views");

app.use(
  cors({
    origin: config.cors.origin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(cookieParser());
app.use(
  session({
    secret: config.sessionSecret,
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
  })
);
app.use(log.logRequestMiddleware());
app.use(flash());
app.use(passport.initialize());

const authenticationWeb = (req, res, next) => {
  // TODO '/' should be a landing page
  if (req.originalUrl === "/" || req.originalUrl.includes("index.html")) {
    return passport.authenticate("jwt", {
      session: false,
      failureRedirect: "/authentication/signin",
      failureFlash: true,
    })(req, res, next);
  } else {
    return next();
  }
};

app.use("/", routeAuthentication);
app.use("/", authenticationWeb, routeSpa);

app.use("/privacy", function (req, res, next) {
  res.render("privacy");
});

app.use("/terms", function (req, res, next) {
  res.render("terms");
});

app.use("/imprint", function (req, res, next) {
  res.render("imprint");
});

app.use(function (req, res, next) {
  res.render("404");
});

app.use(function (err, req, res, next) {
  log.error(err.stack);
  res.render("505");
});

const server = http.createServer(app);
server.listen(port, () => {
  log.info(`Server running on port ${port}`);
});

sharedb.startShareDb(server);
