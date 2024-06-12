const process = require("process");

module.exports = {
  cors: {
    origin: "http://localhost:3001",
  },
  jwtSecret: process.env.AUTH_JWT_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  database: process.env.MONGODB_CONNECTION,
  loggingLevel: "trace",
  authentication: {
    microsoft: {
      // Required
      identityMetadata:
        "https://login.microsoftonline.com/mailmroc.onmicrosoft.com/v2.0/.well-known/openid-configuration",

      // Required, the client ID of your app in AAD
      clientID: process.env.AUTH_MICROSOFT_CLIENT_ID,

      // Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
      // If app key contains '\', replace it with '\\'.
      clientSecret: process.env.AUTH_MICROSOFT_CLIENT_SECRET,

      // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
      // If you want to get access_token, you must use 'code', 'code id_token' or 'id_token code'
      responseType: "code id_token",

      // Required
      responseMode: "form_post",

      // Required, the reply URL registered in AAD for your app
      redirectUrl: `${process.env.EXTERNAL_URL}/authentication/microsoft/return`,

      // Required if we use http for redirectUrl
      allowHttpForRedirectUrl: true,

      // Required to set to false if you don't want to validate issuer
      validateIssuer: false,

      // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
      // issuer could be a string or an array of strings of the following form: 'https://sts.windows.net/<tenant_guid>/v2.0'
      issuer: null,

      // Required to set to true if the `verify` function has 'req' as the first parameter
      passReqToCallback: false,

      // Recommended to set to true. By default we save state in express session, if this option is set to true, then
      // we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
      // to be completely express session free.
      useCookieInsteadOfSession: true,

      // TODO Provide strong random here!
      // Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
      // rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
      // key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
      cookieEncryptionKeys: [
        { key: "TODO_RANDOM_STRING", iv: "TODO_RANDOM_STRING" },
        { key: "TODO_RANDOM_STRING", iv: "TODO_RANDOM_STRING" },
      ],

      // The additional scopes we want besides 'openid'.
      // 'profile' scope is required, the rest scopes are optional.
      // (1) if you want to receive refresh_token, use 'offline_access' scope
      // (2) if you want to get access_token for graph api, use the graph api url like 'https://graph.microsoft.com/mail.read'
      scope: ["profile", "email", "offline_access"],

      // Optional, 'error', 'warn' or 'info'
      loggingLevel: "info",

      // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
      nonceLifetime: null,

      // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
      nonceMaxAmount: 5,

      // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
      clockSkew: null,
    },
    google: {
      clientID: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
      redirectUrl: `${process.env.EXTERNAL_URL}/authentication/google/return`,
      scope: ["profile", "email"],
    },
  },
  sendGrid: {
    apiKey: process.env.MAIL_SENDGRID_API_KEY,
  },
};
