import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import transporter from "../lib/nodemailer";

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

    await transporter.sendMail({
      from: '"NDL Capital Group" <info@ndlcapitalgroup.com>',
      to: result.data.email,
      subject: "We received your message — NDL Capital Group",
      html: `
    <h2>Hi ${result.data.firstName},</h2>
    <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
    <p>Best regards,<br/>NDL Capital Group</p>
  `,
    });

    res.status(201).json({ success: true, id: contact.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
