import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import resend from "../lib/resend";
import { escapeHtml } from "../lib/escapeHtml";

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  company: z.string().optional(),
  interest: z.string().optional(),
  message: z.string().min(1),
  consent: z.boolean(),
});

export const createContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = contactSchema.safeParse(req.body);

  if (!result.success) {
    res
      .status(400)
      .json({ error: "Invalid data", details: result.error.issues });
    return;
  }

  try {
    const contact = await prisma.contact.create({ data: result.data });

    const firstName = escapeHtml(result.data.firstName);
    const lastName = escapeHtml(result.data.lastName);
    const email = escapeHtml(result.data.email);
    const phone = escapeHtml(result.data.phone);
    const company = escapeHtml(result.data.company);
    const interest = escapeHtml(result.data.interest);
    const message = escapeHtml(result.data.message);

    const { error: userEmailError } = await resend.emails.send({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: result.data.email,
      subject: "We received your message — NDL Capital Group",
      html: `
    <h2>Hi ${firstName},</h2>
    <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
    <p>Best regards,<br/>NDL Capital Group</p>
  `,
    });
    if (userEmailError) {
      console.error("Resend contact user email error:", userEmailError);
    }

    const { error: internalEmailError } = await resend.emails.send({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: "ndlcapitalgroup@gmail.com",
      replyTo: result.data.email,
      subject: "New contact form submission — NDL Capital Group",
      html: `
    <h2>New message from ${firstName} ${lastName}</h2>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Company:</strong> ${company || "—"}</p>
    <p><strong>Interest:</strong> ${interest || "—"}</p>
    <p><strong>Message:</strong> ${message}</p>
  `,
    });
    if (internalEmailError) {
      console.error("Resend contact internal email error:", internalEmailError);
    }

    res.status(201).json({ success: true, id: contact.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
