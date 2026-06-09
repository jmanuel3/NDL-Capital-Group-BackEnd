import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "info@ndlcapitalgroup.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default transporter;