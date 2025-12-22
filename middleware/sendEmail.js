require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (email, fullName, otp) => {
  try {
    const msg = {
      from: {
        name: "Build Gether",
        email: process.env.SENDER_EMAIL,
      },
      to: email,
      subject: "Account Registration Verification Code",
      html: `
        <h2>Hello ${fullName},</h2>
        <p>Use the OTP below to verify your account:</p>
        <h1>${otp}</h1>
        <p>Valid for 10 minutes.</p>
      `,
    };

    const response = await sgMail.send(msg);
    console.log("SendGrid Response:", response[0].statusCode);

    return response;
  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendOtpEmail };
