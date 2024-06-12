const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../../config/config");
const log = require("../../services/logging").getLogger("Authentication");

const router = express.Router();

function setJtwCookieAndLogin(req, res) {
  log.info(`Setting JWT on cookie`);
  const userId = req.user.id;
  const user = { id: userId, roles: req.user.roles };
  const token = jwt.sign(user, config.jwtSecret);
  res.cookie("token", token, { httpOnly: true });
  res.cookie("user_id", userId);
  return res.redirect("/");
}

function getMessage(req) {
  let message = req.flash("error") || req.flash("success");
  if (message && message.length > 0 && message[0] === "No auth token") {
    message = null;
  }
  return message;
}

router.get("/authentication/email/signup", function (req, res, next) {
  const message = req.flash("error") || req.flash("success");
  res.render("signup", { message });
});

router.post(
  "/authentication/email/signup",
  passport.authenticate("signup", {
    successRedirect: "/authentication/signin",
    failureRedirect: "/authentication/email/signup",
    session: false,
    failureFlash: true,
  })
);

router.get("/authentication/signin", function (req, res, next) {
  const message = getMessage(req);
  res.render("signin", { message });
});

router.post(
  "/authentication/email/signin",
  passport.authenticate("signin", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  }),
  setJtwCookieAndLogin
);

router.get("/authentication/email/forgot", function (req, res, next) {
  const message = req.flash("error") || req.flash("success");
  res.render("forgot", { message });
});

router.post(
  "/authentication/email/forgot",
  passport.authenticate("password-request", {
    failureSuccess: "/authentication/email/forgot",
    failureRedirect: "/authentication/email/forgot",
    session: false,
    failureFlash: true,
  })
);

router.get(
  "/authentication/email/forgot/:token",
  passport.authenticate("password-set-allowed", {
    failureRedirect: "/authentication/email/forgot",
    session: false,
    failureFlash: true,
  }),
  async (req, res) => {
    const message = req.flash("error") || req.flash("success");
    const token = req.params.token;
    return res.render("password", { message, token });
  }
);

router.post("/authentication/email/forgot/:token", async (req, res) => {
  passport.authenticate(
    "password-set",
    {
      session: false,
      failureFlash: true,
    },
    function (err, user, info) {
      req.flash("error", info.message);
      if (err || !user) {
        return res.redirect(`/authentication/email/forgot/${req.params.token}`);
      } else {
        return res.redirect("/authentication/signin");
      }
    }
  )(req, res);
});

router.get(
  "/authentication/signout",
  passport.authenticate("jwt", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  }),
  function (req, res, next) {
    log.info(`Removing JWT from cookie`);
    res.clearCookie("token");
    return res.redirect("/authentication/signin");
  }
);

router.get(
  "/authentication/microsoft/signin",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  })
);

router.get(
  "/authentication/microsoft/return",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  }),
  setJtwCookieAndLogin
);

router.post(
  "/authentication/microsoft/return",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  }),
  setJtwCookieAndLogin
);

router.get(
  "/.well-known/microsoft-identity-association.json",
  function (req, res, next) {
    res.json({
      associatedApplications: [
        {
          applicationId: "6d191d95-2c35-41bc-87ac-2fb66718e578",
        },
      ],
    });
  }
);

router.get(
  "/authentication/google/signin",
  passport.authenticate("google", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  })
);

router.get(
  "/authentication/google/return",
  passport.authenticate("google", {
    failureRedirect: "/authentication/signin",
    session: false,
    failureFlash: true,
  }),
  setJtwCookieAndLogin
);

module.exports = router;
