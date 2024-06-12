const config = require("../../config/config");
const formatString = require("util").format;
const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");

const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: config.sendGrid.apiKey,
  })
);

const texts = {
  emailFrom: "mail@mroc.de",
  emailSignupSubject: "Please confirm your email address for Seqoio",
  emailSignup: `Hey,
      
  Please confirm your email address to finish your Seqoio account.
  
  To do so, please click on the following link, or paste this into your browser to complete the process:
  %s
  
  If you did not request this, please ignore this email.
  
  Matthias from Seqoio`,
  emailSetPasswordSubject: "Seqoio password reset",
  emailSetPassword: `Hey,
      
  You are receiving this email because you or someone else has requested the reset of the password for your account.
  
  Please click on the following link, or paste this into your browser to complete the process:
  %s
  
  If you did not request this, please ignore this email and your password will remain unchanged.
  
  Matthias from Seqoio`,
  emailPasswordChangedSubject: "Seqoio password has been updated",
  emailPasswordChangedBody: `Hey,
  
  The password for your Seqoio account was successfully updated!
  
  Matthias from Seqoio`,

  emailSubject: "Welcome to Seqoio",
  emailBody: `Hey,
    
  Welcome to the Seqoio, we're happy to have you on board!

  Matthias from Seqoio`,
};


async function sendSignupEmail(email, url) {
  const resetEmail = {
    to: email,
    from: texts.emailFrom,
    subject: texts.emailSignupSubject,
    text: formatString(texts.emailSignup, url),
  };
  await transport.sendMail(resetEmail);
}

async function sendSetPasswordEmail(email, url) {
  const resetEmail = {
    to: email,
    from: texts.emailFrom,
    subject: texts.emailSetPasswordSubject,
    text: formatString(texts.emailSetPassword, url),
  };
  await transport.sendMail(resetEmail);
}

async function sendSetPasswordConfirmation(email) {
  const resetEmail = {
    to: email,
    from: texts.emailFrom,
    subject: texts.emailPasswordChangedSubject,
    text: texts.emailPasswordChangedBody,
  };
  await transport.sendMail(resetEmail);
}

async function sendWelcomeEmail(email) {
  const welcomeEmail = {
    to: email,
    from: texts.emailFrom,
    subject: texts.emailSubject,
    text: texts.emailBody,
  };
  await transport.sendMail(welcomeEmail);
}

module.exports = {
  sendWelcomeEmail,
  sendSignupEmail,
  sendSetPasswordEmail,
  sendSetPasswordConfirmation,
};
