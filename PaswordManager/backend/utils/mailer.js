const Nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");
const dotenv = require("dotenv");

dotenv.config();

const TOKEN = process.env.MAILTRAP_TOKEN || "123";

const transport = Nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  })
);

const sender = {
  address: "hello@demomailtrap.co",
  name: "Mailtrap Test",
};

/**
 * Sends a login confirmation email.
 * @param {string} recipientEmail - The email of the user who logged in.
 */
const sendLoginEmail = async (recipientEmail) => {
  try {
    await transport.sendMail({
      from: sender,
      to: [recipientEmail],
      subject: "Login Confirmation",
      text: "Congrats you have successfully logged in to your account. Now all your passwords will safe with us.",
      category: "Important",
    });
    console.log(`Login confirmation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {
  sendLoginEmail,
};
