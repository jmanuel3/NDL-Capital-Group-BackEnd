import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: "info@ndlcapitalgroup.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default transporter;
