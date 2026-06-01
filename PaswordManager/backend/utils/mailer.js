const Nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");
const dotenv = require("dotenv");

dotenv.config();

const TOKEN = process.env.MAILTRAP_TOKEN;

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
 * Sends an OTP email.
 * @param {string} recipientEmail - The email of the user.
 * @param {string} otp - The OTP to send.
 */
const sendOTPEmail = async (recipientEmail, otp) => {
  try {
    await transport.sendMail({
      from: sender,
      to: [recipientEmail],
      subject: "Verification OTP",
      text: `Your OTP for verification is: ${otp}. It will expire in 5 minutes.`,
      category: "Important",
    });
    console.log(`OTP email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {
  sendOTPEmail,
};
