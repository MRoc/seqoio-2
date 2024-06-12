const JwtStrategy = require("passport-jwt").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const OIDCStrategy = require("passport-azure-ad").OIDCStrategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const CustomStrategy = require("passport-custom").Strategy;
const { UserModel, UserStates, DefaultRoles } = require("../models/user");
const config = require("../../config/config");
const log = require("../../services/logging").getLogger("Authentication");
const crypto = require("crypto");
const promisify = require("util").promisify;
const formatString = require("util").format;
const emails = require("./email");

// db.users.update({ email: "mail@mroc.de" }, { $set: { state: "creating" } });

const texts = {
  invalidEmailAddress: "Sorry, but this did not look like an email address!",
  passwortTooWeak:
    "Sorry, but your password is not strong enough. The password must be at least 8 characters long and contain lower-case, upper-case and numerical values.",
  incorrectPassword: "Sorry, incorrect email address and / or password.",
  noAccountWithThatEmail: "Sorry, but there is no account with this email!",
  allreadyAccountWithThatEmail: "There is already an account with this email!",
  invalidPasswordResetToken:
    "Sorry, but the password reset link is invalid or has expired!",
  wrongProvider: "You are registered with %s. Please use it to sign in.",
  passwordEmailSent: "We've sent you an email!",
  passwordSuccessfullyCanged:
    "Your password was successfully set, continue to sign in.",
  messageEmailSent:
    "Thank you for your interest in Seqoio. We will let you know ASAP once we take the next step.",
};

module.exports = function (passport) {
  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePasswordStrength = (password) => {
    const re =
      /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/;
    return re.test(String(password));
  };

  passport.use(
    "signup",
    new CustomStrategy(async (req, done) => {
      const email = req.body.email;

      const isValidEmail = validateEmail(email);
      if (!isValidEmail) {
        log.warn("Invalid email");
        return done(null, false, {
          message: texts.invalidEmailAddress,
        });
      }

      let user = await UserModel.findOne({ email });
      if (user) {
        if (user.state === UserStates.VERIFY) {
          log.warn("Waiting for email verification");
          return done(null, false, {
            message: texts.allreadyWaitingForEmailVerification,
          });
        } else {
          log.warn("Known email");
          return done(null, false, {
            message: texts.allreadyAccountWithThatEmail,
          });
        }
      }

      log.info("Creating email user");
      const token = (await promisify(crypto.randomBytes)(32)).toString("hex");
      user = await UserModel.create({
        state: UserStates.VERIFY,
        roles: DefaultRoles,
        provider: "email",
        email: email,
        passwordResetToken: token,
        passwordResetTokenExpire: Date.now() + 3600000,
      });

      log.info("Sending email");
      await emails.sendSignupEmail(
        user.email,
        `${process.env.EXTERNAL_URL}/authentication/email/forgot/${token}`
      );

      return done(null, false, {
        message: texts.passwordEmailSent,
      });
    })
  );

  passport.use(
    "signin",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await UserModel.findOne({ email });
          if (!user) {
            log.warn("Unknown email");
            return done(null, false, {
              message: texts.noAccountWithThatEmail,
            });
          }

          const isEmailProvider = user.provider === "email";
          if (!isEmailProvider) {
            log.warn("Wrong provider");
            return done(null, false, {
              message: formatString(texts.wrongProvider, user.provider),
            });
          }

          const isValidPassword = await user.isValidPassword(password);
          if (!isValidPassword) {
            log.warn("Wrong password");
            return done(null, false, {
              message: texts.incorrectPassword,
            });
          }

          log.info("Local user found");
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "password-request",
    new CustomStrategy(async (req, done) => {
      const email = req.body.email;

      const isValidEmail = validateEmail(email);
      if (!isValidEmail) {
        log.warn("Invalid email");
        return done(null, false, {
          message: texts.invalidEmailAddress,
        });
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        log.warn("Unknown email");
        return done(null, false, {
          message: texts.noAccountWithThatEmail,
        });
      }

      if (user.provider !== "email") {
        log.warn("Wrong provider");
        return done(null, false, {
          message: formatString(texts.wrongProvider, user.provider),
        });
      }

      const token = (await promisify(crypto.randomBytes)(32)).toString("hex");
      user.passwordResetToken = token;
      user.passwordResetTokenExpire = Date.now() + 3600000;
      await user.save();

      log.info("Sending email");
      await emails.sendSetPasswordEmail(
        user.email,
        `${process.env.EXTERNAL_URL}/authentication/email/forgot/${token}`
      );

      return done(null, false, {
        message: texts.passwordEmailSent,
      });
    })
  );

  passport.use(
    "password-set-allowed",
    new CustomStrategy(async (req, done) => {
      const token = req.params.token;

      const user = await UserModel.findOne({
        passwordResetToken: token,
        passwordResetTokenExpire: { $gte: Date.now() },
      });

      if (!user) {
        log.warn("Invalid token");
        return done(null, false, {
          message: texts.invalidPasswordResetToken,
        });
      }

      return done(null, user);
    })
  );

  passport.use(
    "password-set",
    new CustomStrategy(async (req, done) => {
      const token = req.params.token;
      const user = await UserModel.findOne({
        passwordResetToken: token,
        passwordResetTokenExpire: { $gte: Date.now() },
      });

      if (!user) {
        log.warn("Invalid token");
        return done(null, false, {
          message: texts.invalidPasswordResetToken,
        });
      }

      const password = req.body.password;
      const isStrongPassword = validatePasswordStrength(password);
      if (!isStrongPassword) {
        log.warn("Weak password");
        return done(null, false, {
          message: texts.passwortTooWeak,
        });
      }

      user.state = UserStates.ACTIVE;
      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpire = undefined;
      await user.save();

      log.info("Sending email");
      await emails.sendSetPasswordConfirmation(user.email);

      return done(null, user, {
        message: texts.passwordSuccessfullyCanged,
      });
    })
  );

  passport.use(
    new OIDCStrategy(
      {
        identityMetadata: config.authentication.microsoft.identityMetadata,
        clientID: config.authentication.microsoft.clientID,
        responseType: config.authentication.microsoft.responseType,
        responseMode: config.authentication.microsoft.responseMode,
        redirectUrl: config.authentication.microsoft.redirectUrl,
        allowHttpForRedirectUrl:
          config.authentication.microsoft.allowHttpForRedirectUrl,
        clientSecret: config.authentication.microsoft.clientSecret,
        validateIssuer: config.authentication.microsoft.validateIssuer,
        isB2C: config.authentication.microsoft.isB2C,
        issuer: config.authentication.microsoft.issuer,
        passReqToCallback: config.authentication.microsoft.passReqToCallback,
        scope: config.authentication.microsoft.scope,
        loggingLevel: config.authentication.microsoft.loggingLevel,
        nonceLifetime: config.authentication.microsoft.nonceLifetime,
        nonceMaxAmount: config.authentication.microsoft.nonceMaxAmount,
        useCookieInsteadOfSession:
          config.authentication.microsoft.useCookieInsteadOfSession,
        cookieEncryptionKeys:
          config.authentication.microsoft.cookieEncryptionKeys,
        clockSkew: config.authentication.microsoft.clockSkew,
        loggingNoPII: false,
      },
      async (iss, sub, profile, accessToken, refreshToken, done) => {
        const provider = "azure-ad";
        const oid = profile._json.oid;
        const email = profile._json.email;

        let user = await UserModel.findOne({ provider, providerId: oid });
        if (user) {
          log.info("Azure-AD user found");
          return done(null, user);
        }

        user = await UserModel.findOne({ email });
        if (user) {
          if (user.state === UserStates.VERIFY) {
            log.warn("Waiting for email verification");
            return done(null, false, {
              message: texts.allreadyWaitingForEmailVerification,
            });
          } else {
            log.warn("Known email");
            return done(null, false, {
              message: formatString(texts.wrongProvider, user.provider),
            });
          }
        }

        log.info("Updating Azure-AD user");
        log.info("Create Azure-AD user");
        user = await UserModel.create({
          oid,
          state: UserStates.ACTIVE,
          roles: DefaultRoles,
          provider,
          providerId: oid,
          email,
        });

        await emails.sendWelcomeEmail(user.email);

        done(null, user);
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.authentication.google.clientID,
        clientSecret: config.authentication.google.clientSecret,
        callbackURL: config.authentication.google.redirectUrl,
        scope: config.authentication.google.scope,
      },
      async (accessToken, refreshToken, profile, done) => {
        const provider = "google";
        const oid = profile.id;
        const email = profile._json.email;

        let user = await UserModel.findOne({ provider, providerId: oid });
        if (user) {
          log.info("Google user found");
          return done(null, user);
        }

        user = await UserModel.findOne({ email });
        if (user) {
          if (user.state === UserStates.VERIFY) {
            log.warn("Waiting for email verification");
            return done(null, false, {
              message: texts.allreadyWaitingForEmailVerification,
            });
          } else {
            log.warn("Known email");
            return done(null, false, {
              message: formatString(texts.wrongProvider, user.provider),
            });
          }
        }

        log.info("Create Google user");
        user = await UserModel.create({
          oid,
          state: UserStates.ACTIVE,
          roles: DefaultRoles,
          provider,
          providerId: oid,
          email,
        });

        await emails.sendWelcomeEmail(user.email);

        done(null, user);
      }
    )
  );

  const jwtOptions = {
    jwtFromRequest: (req) => (req && req.cookies ? req.cookies.token : null),
    secretOrKey: config.jwtSecret,
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (token, done) => {
      try {
        return done(null, { id: token.id, roles: token.roles });
      } catch (error) {
        done(error);
      }
    })
  );

  return passport;
};
