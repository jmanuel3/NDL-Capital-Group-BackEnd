import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: "info@ndlcapitalgroup.com",
    pass: process.env.EMAIL_PASSWORD,
  },
} as SMTPTransport.Options);

export default transporter;
