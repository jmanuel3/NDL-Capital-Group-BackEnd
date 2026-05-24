import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  interest: z.string().optional(),
  message: z.string().optional(),
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
      .json({ error: "Invalid data", details: result.error.flatten() });
    return;
  }

  try {
    const contact = await prisma.contact.create({ data: result.data });
    res.status(201).json({ success: true, id: contact.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
